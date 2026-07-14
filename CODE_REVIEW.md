# Code Review Completo — MCRh Website
**Foco:** Usabilidade, Layout, Tipografia, Responsividade, Acessibilidade, Bugs, Dados, Componentes, SEO, Performance  
**Data:** 2026-06-15  
**Arquivos revisados:** Todos os arquivos em `src/` (App.tsx, todos os pages/, todos os components/, todos os data/, index.css, index.html, vite.config.ts)

---

## Sumário Executivo

O projeto tem um design system bem pensado e uma base visual elegante, mas está **incompleto em pontos críticos de fluxo de usuário**. Vários botões são decorativos, o menu mobile não funciona, formulários não enviam, dados de review são fabricados e datados de 2023, mapas são placeholders, e há duplicação massiva de código entre páginas. O site não passa em nenhuma auditoria básica de SEO nem de acessibilidade. Há também um bug de hoisting em ManagementServices que, embora funcione por acaso em JS, é um risco de manutenção.

**Severidades encontradas:** 8 CRITICAL · 28 WARNING · 14 SUGGESTION · 6 NITPICK

---

# 1. USABILIDADE

---

### ✅ OK FEITO — [CRITICAL] Menu mobile completamente inoperante

**Arquivo:** `src/components/Navbar.tsx:35`  
**Problema:** O botão hamburger existe visualmente mas `<button className="md:hidden text-primary"><Menu /></button>` não tem `onClick`. Nenhum painel de navegação mobile é renderizado em nenhum lugar do componente.  
**Impacto:** Em viewport < 768px (md), os links de navegação ficam ocultos com `hidden md:flex` e o botão não faz nada — o usuário não consegue ir para Properties, About, Contact ou qualquer página.  
**Fix:**
```tsx
const [menuOpen, setMenuOpen] = useState(false);

// Botão:
<button onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen} className="md:hidden text-primary">
  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
</button>

// Logo após o </header>, dentro do <header>:
{menuOpen && (
  <nav className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-outline-variant/30 px-6 py-8 flex flex-col gap-6 z-50">
    <Link to="/properties" onClick={() => setMenuOpen(false)} className="text-label-caps text-on-surface-variant">Properties</Link>
    <Link to="/design-services" onClick={() => setMenuOpen(false)} className="text-label-caps text-on-surface-variant">Design Services</Link>
    <Link to="/management-services" onClick={() => setMenuOpen(false)} className="text-label-caps text-on-surface-variant">Management Services</Link>
    <Link to="/about" onClick={() => setMenuOpen(false)} className="text-label-caps text-on-surface-variant">About</Link>
    <Link to="/contact" onClick={() => setMenuOpen(false)} className="text-label-caps text-on-surface-variant">Contact</Link>
    <Link to="/properties" onClick={() => setMenuOpen(false)} className="border border-primary text-primary px-6 py-3 text-label-caps text-center">Book Now</Link>
  </nav>
)}
```

---

### ✅ OK FEITO — [CRITICAL] Botão "Reserve Now" não faz nada

**Arquivo:** `src/pages/PropertyDetail.tsx:141-152`  
**Problema:** O `onClick` do botão apenas abre o date picker se as datas estiverem vazias. Se o usuário preencheu check-in, check-out e guests e clica em "Reserve Now", **absolutamente nada acontece** — sem redirecionamento, sem formulário, sem confirmação.  
**Impacto:** O fluxo principal do produto está quebrado. O usuário está pronto para reservar e é bloqueado silenciosamente.  
**Fix:** Quando datas estão preenchidas, redirecionar para a URL do Airbnb da listagem:
```tsx
onClick={() => {
  if (!checkIn || !checkOut) {
    setDatesOpen(true);
    return;
  }
  const airbnbUrl = inventoryUnit?.airbnbUrl || listingMedia?.finalUrl;
  if (airbnbUrl) {
    window.open(airbnbUrl, '_blank', 'noopener,noreferrer');
  } else {
    // Fallback: redirecionar para /contact
    window.location.href = `/contact?unit=${unit.slug}`;
  }
}}
```

---

### ✅ OK FEITO — [CRITICAL] Formulário de contato não envia absolutamente nada

**Arquivo:** `src/pages/Contact.tsx:38`  
**Problema:** `onSubmit={(e) => e.preventDefault()}` e nada mais. Sem fetch, sem toast de sucesso, sem loading state, sem validação. O botão "Submit Inquiry" é puramente decorativo.  
**Impacto:** Um usuário interessado em alugar ou contratar design/management preenche o formulário, clica em enviar e… nada acontece. Conversão zero.  
**Fix mínimo viável:** Integrar Formspree (sem backend) ou adicionar `mailto:` como fallback:
```tsx
const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setStatus('sending');
  try {
    const data = new FormData(e.currentTarget);
    await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' },
    });
    setStatus('sent');
  } catch {
    setStatus('error');
  }
}
```

---

### ✅ OK FEITO — [CRITICAL] Botão "Enquire Now" em DesignServices sem ação

**Arquivo:** `src/pages/DesignServices.tsx:75`  
**Problema:** `<button className="...">Enquire Now</button>` sem `onClick`. Não navega para `/contact`, não abre modal, não faz nada.  
**Impacto:** Página de serviços de design não converte — o CTA principal é inoperante.  
**Fix:** `<Link to="/contact?inquiry=design" ...>Enquire Now</Link>` ou adicionar `onClick={() => navigate('/contact')}`.

---

### ✅ OK FEITO — [CRITICAL] Widget de disponibilidade sempre mostra "Available" (dado falso)

**Arquivo:** `src/components/AvailabilityWidget.tsx:20-30`  
**Problema:** `checkAvailability()` faz `setStatus('Available')` incondicionalmente, sem nenhuma chamada a API. Qualquer propriedade, em qualquer data, sempre aparece como disponível.  
**Impacto:** Informação deliberadamente enganosa para o usuário. Quem vê "Available" acredita que pode reservar aquela data — quando na realidade o sistema não sabe.  
**Fix:** Remover o badge de status até que haja integração real. Enquanto isso, substituir por "Contact us to confirm availability" ou remover o AvailabilityWidget da CollectionDetail e substituir por um CTA para o Airbnb.

---

### [CRITICAL] Setas prev/next de reviews não funcionam

**Arquivo:** `src/pages/PropertyDetail.tsx:232-238`  
**Problema:** Dois botões com ArrowLeft/ArrowRight no desktop, sem `onClick`. O container de reviews `.overflow-x-auto` nunca faz scroll programático.  
**Impacto:** Usuário desktop vê botões de navegação mas não consegue passar de uma review para outra pela UI — só pelo scroll horizontal manual.  
**Fix:**
```tsx
const scrollRef = useRef<HTMLDivElement>(null);

function scrollReviews(direction: 'left' | 'right') {
  if (!scrollRef.current) return;
  scrollRef.current.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' });
}

// Na div do slider:
<div ref={scrollRef} className="flex overflow-x-auto ...">

// Nos botões:
<button onClick={() => scrollReviews('left')} ...><ArrowLeft /></button>
<button onClick={() => scrollReviews('right')} ...><ArrowRight /></button>
```

---

### ✅ OK FEITO — [CRITICAL] Botões "Show All Amenities" e "View Gallery" sem ação

**Arquivo:** `src/pages/PropertyDetail.tsx:187` e `214`  
**Problema:** Ambos os botões existem visualmente sem nenhum `onClick`. O usuário clica e não acontece nada.  
**Impacto:** Dois pontos de engajamento mortos na página mais importante do produto (detalhe do imóvel).  
**Fix:** Implementar modal/lightbox de galeria de fotos e expandir a lista de amenidades via accordion/modal, OU remover os botões completamente até que a feature exista. Deixar botões que não fazem nada é pior do que não ter botões.

---

### [WARNING] Dropdowns sem "fechar ao clicar fora"

**Arquivos:** `src/pages/Home.tsx:203-232`, `src/components/AvailabilityWidget.tsx:43-65`, `src/pages/PropertyDetail.tsx:63-98`, `src/pages/PropertyDetail.tsx:113-139`  
**Problema:** Todos os dropdowns (filtro de área no mapa, date picker, guest selector) abrem mas não fecham ao clicar fora deles. O único jeito de fechar é selecionar uma opção.  
**Impacto:** UX confusa — o usuário abre acidentalmente um dropdown e não sabe como fechar.  
**Fix:** Adicionar um hook `useClickOutside` ou um `useEffect` com `document.addEventListener('mousedown', handler)` em cada dropdown.

---

### [WARNING] CollectionDetail faz fallback silencioso para Chambers

**Arquivo:** `src/pages/CollectionDetail.tsx:11`  
**Problema:** `const property = getPropertyBySlug(id) || getPropertyBySlug('chambers')` — se a URL `/collection/qualquercoisa` não bater com nenhuma propriedade, mostra os dados de Chambers sem aviso.  
**Impacto:** URLs inválidas mostram dados errados. Um usuário que digita errado a URL vê Chambers pensando estar vendo o imóvel certo. Dificulta depuração.  
**Fix:** Remover o fallback e renderizar uma página de 404 ou `<Navigate to="/properties" />`.

---

### [WARNING] Filtro de mapa em Home não tem "The Collective" como área filtrável

**Arquivo:** `src/data/locations.ts:36-42`, `src/pages/Home.tsx`  
**Problema:** `locationAreas` tem `city-centre`, `deansgate`, `ancoats`, `old-trafford` — mas The Collective tem `areaId: 'city-centre'`, então aparece no filtro city-centre junto com Chambers e Wood Street, sem destaque próprio.  
**Impacto:** Usuário que quer filtrar especificamente The Collective não tem como.

---

# 2. LAYOUT / DIAGRAMAÇÃO

---

### [CRITICAL] Booking card em mobile sobrepõe conteúdo sem compensação

**Arquivo:** `src/pages/PropertyDetail.tsx:53`  
**Problema:** `translate-y-1/2 md:translate-y-1/4` no booking card — em mobile ele desloca metade da sua altura para baixo, invadindo a seção de specs abaixo. A seção de specs tem `py-6 mt-12 md:mt-16` mas não compensa a altura do card que pode ter 300-400px em mobile.  
**Impacto:** No mobile o card de reserva provavelmente sobrepõe ou cobre os specs de quartos/banheiros.  
**Fix:** Aplicar `translate-y` apenas no md+ e no mobile usar margin-top simples:
```tsx
<div className="relative w-full md:w-1/3 ... md:translate-y-1/4">
```
E na seção seguinte compensar com `mt-[card-height]` no mobile.

---

### [WARNING] Alturas fixas em pixels nos heroes causam problemas em telas menores

**Arquivos:** `src/pages/PropertyDetail.tsx:40` (`h-[819px] md:h-[921px]`), `src/pages/Properties.tsx:8` (`h-screen`)  
**Problema:** `h-[819px]` num iPhone SE (height 667px) em portrait faz o hero ser maior que a tela, e o conteúdo interno com `items-end` fica abaixo do fold com scroll necessário só para ver o título. `h-screen` em Properties com `items-end` e `pb-section-gap` (120px) pode cortar o texto em telas pequenas com browser chrome.  
**Fix:** Usar `min-h-[600px] h-[90vh]` como padrão para heroes — se adapta à tela mas garante altura mínima.

---

### [WARNING] Seções alternadas têm double-border entre elas

**Arquivo:** `src/pages/CollectionDetail.tsx:56-76`  
**Problema:** A specs row tem `border-b border-outline-variant/30` e a seção seguinte tem `border-t border-outline-variant/30`. Duas bordas adjacentes criam uma linha visivelmente mais grossa ou um espaço duplo.  
**Fix:** Remover uma das duas bordas. Usar apenas `border-b` na specs row ou apenas `border-t` na seção abaixo.

---

### [WARNING] Gap de testimonials em Home vai na direção errada

**Arquivo:** `src/pages/Home.tsx:320`  
**Problema:** `gap-16 md:gap-12 lg:gap-24` — ao passar para md (3 colunas), o gap DIMINUI de 64px para 48px antes de aumentar para 96px no lg. Isso cria um comportamento visual estranho em tablets.  
**Fix:** `gap-12 md:gap-8 lg:gap-24` ou simplesmente `gap-12 lg:gap-24`.

---

### [WARNING] Imagens de coleção em Home têm layout inconsistente entre propriedades

**Arquivo:** `src/pages/Home.tsx:40-48` vs `src/pages/Home.tsx:75-88`  
**Problema:** Chambers, Wood Street e Trafford usam o layout de "duas fotos sobrepostas absolutas" (`.absolute top-0 left-0 w-[85%]` + `.absolute bottom-0 right-0 w-[55%]`), enquanto John Dalton, Ancoats e The Collective usam um grid `grid-cols-2` com uma citação no lugar da segunda foto. Não há coerência — parece que foram designs diferentes aplicados por seção sem padrão.  
**Impacto:** O usuário percebe a inconsistência visual. Numa marca de "luxo" isso prejudica a percepção de qualidade.

---

### [WARNING] Classe `scrollbar-hide` usada mas não definida

**Arquivo:** `src/pages/Home.tsx:236`  
**Problema:** `className="overflow-y-auto pr-4 pb-4 space-y-6 flex-1 scrollbar-hide"` — `scrollbar-hide` não é uma utility nativa do Tailwind v4 nem está definida em `index.css`. Se não houver um plugin configurado, a scrollbar aparece visualmente.  
**Fix:** Adicionar em `index.css`:
```css
@utility scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
}
```

---

### [WARNING] Footer extremamente minimal para marca de luxo

**Arquivo:** `src/components/Footer.tsx`  
**Problema:** O footer tem apenas o logo, copyright e 5 links (4 quebrados). Não há: endereço, telefone, links de redes sociais, links para as propriedades, horário de atendimento, ou qualquer conteúdo que reforce a marca.  
**Impacto:** Um usuário que chega ao final da página fica sem informação de contato rápido ou navegação secundária.

---

### [SUGGESTION] Home hero: botão CTA tem padding inconsistente com o resto

**Arquivo:** `src/pages/Home.tsx:29-33`  
**Problema:** O container do CTA tem `pb-2` sem motivação clara. O botão dentro tem `px-8 py-4` mas na versão mobile é `w-full` enquanto o texto é centralizado com `justify-center` — isso está correto mas cria um visual diferente do botão equivalente nas seções de propriedades que têm `inline-flex`.

---

### [SUGGESTION] Seção de mapa em CollectionDetail usa placeholder com texto literal visível

**Arquivo:** `src/pages/CollectionDetail.tsx:121`  
**Problema:** `<span ...>EDITORIAL MAP PLACEHOLDER</span>` — texto de desenvolvimento aparece em produção para todos os usuários.

---

# 3. TIPOGRAFIA

---

### [WARNING] Hierarquia H1/H2 duplicada em CollectionDetail

**Arquivo:** `src/pages/CollectionDetail.tsx:49` e `82`  
**Problema:** Linha 49: `<h1 ...>{property.name}</h1>` (no hero). Linha 82: `<h2 ...>{property.name}</h2>` (na seção de descrição). O mesmo texto é usado como H1 E H2 na mesma página.  
**Impacto:** Screen readers e bots de SEO encontram hierarquia confusa e conteúdo duplicado entre headings.  
**Fix:** O H2 na seção de descrição deveria ser o `property.eyebrow` ou "About this property" — algo diferente do nome.

---

### [WARNING] Text de review muito grande para o container

**Arquivo:** `src/pages/PropertyDetail.tsx:272`  
**Problema:** Reviews usam `text-quote` (28px/1.4 line-height) dentro de cards `min-w-[300px]`. Uma review com texto médio terá 4-5 linhas a 28px num card de 300px de largura — isso ocupa quase toda a altura do card e parece desproporcional.  
**Fix:** Usar `text-body-lg` (18px) ou `text-xl` para o texto de reviews dentro dos cards. Reservar `text-quote` para citações em seções editoriais abertas (como na About page).

---

### [WARNING] `leading-[1.1]` inline sobrepõe a utility do design system

**Arquivo:** `src/pages/Home.tsx:26`  
**Problema:** `<h1 className="font-display text-display-lg-mobile md:text-display-lg text-white mb-6 leading-[1.1]">` — `text-display-lg` já define `line-height: 1.1` e `text-display-lg-mobile` define `line-height: 1.2`. O `leading-[1.1]` inline sobrepõe o valor mobile para 1.1, colidindo com o design system.  
**Fix:** Remover o `leading-[1.1]` inline — as utilities já cuidam disso.

---

### [WARNING] Uso inconsistente de tamanhos de fonte inline vs utilities

**Arquivos:** `src/pages/PropertyDetail.tsx:96`, `src/pages/Contact.tsx:15`, `src/components/AvailabilityWidget.tsx:36`, múltiplos  
**Problema:** O design system define `text-label-caps` (12px uppercase tracking) mas muitos lugares usam `text-[10px] uppercase tracking-widest` inline, duplicando os valores sem usar a utility. Encontrado em pelo menos 8 locais diferentes.  
**Fix:** Substituir todas as instâncias de `text-[10px] uppercase tracking-widest` por `text-label-caps`.

---

### [WARNING] `text-display-lg-mobile` e `text-display-lg` com `leading-tight` em Properties

**Arquivo:** `src/pages/Properties.tsx:15`  
**Problema:** `font-display text-display-lg-mobile md:text-display-lg mb-6 leading-tight text-white` — `leading-tight` corresponde a `line-height: 1.25` que sobrepõe `line-height: 1.1` do `text-display-lg`. Para um título de 64px, a diferença é enorme e o texto ficará mais espaçado do que o design system especifica.  
**Fix:** Remover `leading-tight`.

---

### [SUGGESTION] Copyright desatualizado

**Arquivo:** `src/components/Footer.tsx:11`  
**Problema:** `© 2024 MCRh Luxury Lettings` — ano errado em 2026.  
**Fix:** `© {new Date().getFullYear()} MCRh Luxury Lettings`

---

### [NITPICK] Espaçamento de `text-label-caps` para linha dupla causa overflow

**Arquivo:** `src/index.css:77`  
**Problema:** `line-height: 1.0` em `text-label-caps` — se esse texto quebrar em duas linhas, elas ficarão coladas (sem respiro). Aumentar para `line-height: 1.3` seria mais seguro.

---

# 4. RESPONSIVIDADE

---

### [CRITICAL] Menu mobile inoperante (já detalhado em Usabilidade #1)

---

### [WARNING] Hero em PropertyDetail maior que a tela em mobile portrait

**Arquivo:** `src/pages/PropertyDetail.tsx:40`  
**Problema:** `h-[819px]` — iPhone 14 Pro tem 844px de altura física mas ~750px de viewport altura com browser chrome. O hero é maior que a tela, e com `flex items-end pb-section-gap` (120px), o conteúdo começa a aparecer ~120px antes do fundo da div. Em telas pequenas o H1 pode estar abaixo do fold.  
**Fix:** `min-h-[600px] h-[85vh]`

---

### [WARNING] Grid de imagens "two-col" pode colapsar mal em mobile

**Arquivo:** `src/pages/Home.tsx:75-88`, `src/pages/Properties.tsx:64-77`  
**Problema:** O grid `grid-cols-2 gap-4 h-[500px] md:h-[700px]` em mobile (1 coluna por padrão) não tem `grid-cols-1` explícito. Na realidade `grid-cols-2` é aplicado em TODOS os viewports — em mobile o grid de 2 colunas persiste mas a altura fixa de 500px divide o espaço em blocos pequenos demais.  
**Fix:** `grid-cols-2` com `h-[320px] md:h-[700px]` no mobile, ou converter para `grid-cols-1` no mobile com uma imagem única.

---

### [WARNING] `py-section-gap` (120px) em mobile é excessivo

**Arquivo:** `src/index.css:35`, usado em quase todas as seções  
**Problema:** `--spacing-section-gap: 120px` aplicado como `py-section-gap` em todas as seções sem distinção. Em mobile, 120px de padding vertical em cada seção consome muito espaço e faz a página ser extremamente longa.  
**Fix:** Definir um token mobile: `--spacing-section-gap-mobile: 64px` e usar `py-[64px] md:py-section-gap`.

---

### [WARNING] "Book Now" CTA em Navbar desktop fica oculto em mobile sem alternativa

**Arquivo:** `src/components/Navbar.tsx:32`  
**Problema:** `hidden md:block` no botão "Book Now" da navbar. No mobile, o usuário não tem acesso a um CTA principal de reserva na navbar. Se o menu mobile for implementado, é essencial incluir esse CTA lá.

---

### [SUGGESTION] Imagem hero de CollectionDetail com `loading="eager"` está correta, mas as demais do mesmo componente usam lazy

**Arquivo:** `src/pages/CollectionDetail.tsx:44`, `src/components/MediaImage.tsx:17`  
**Problema:** O `loading="eager"` está correto para a primeira imagem acima do fold. As imagens das units na coleção grid (`apt.imageSrc`) não passam `loading` então ficam `lazy` por padrão — isso é correto. Não é um bug, mas vale confirmar que o fallback `propertySlug` no `MediaImage` não está carregando eager por engano.

---

# 5. ACESSIBILIDADE

---

### ✅ OK FEITO (junto com fix #4) — [CRITICAL] Todos os labels do formulário de contato desassociados dos inputs

**Arquivo:** `src/pages/Contact.tsx:41-84`  
**Problema:** Nenhum `<label>` tem `htmlFor` e nenhum `<input>`/`<textarea>`/`<select>` tem `id`. Tecnologicamente as labels são apenas texto decorativo — clicar nelas não foca o campo correspondente, e screen readers não fazem a associação.  
**Fix:**
```tsx
<label htmlFor="firstName" ...>First Name</label>
<input id="firstName" name="firstName" type="text" ... />

<label htmlFor="lastName" ...>Last Name</label>
<input id="lastName" name="lastName" type="text" ... />

<label htmlFor="email" ...>Email Address</label>
<input id="email" name="email" type="email" ... />

<label htmlFor="inquiryType" ...>Inquiry Type</label>
<select id="inquiryType" name="inquiryType" ...>

<label htmlFor="message" ...>Message</label>
<textarea id="message" name="message" ...>
```

---

### [CRITICAL] Botão hamburger sem aria-label e sem aria-expanded

**Arquivo:** `src/components/Navbar.tsx:35`  
**Problema:** `<button className="md:hidden text-primary"><Menu className="w-6 h-6" /></button>` — sem `aria-label`, um screen reader anuncia isso como "button" sem contexto. Sem `aria-expanded`, o estado aberto/fechado do menu não é comunicado.  
**Fix:**
```tsx
<button
  aria-label="Toggle navigation menu"
  aria-expanded={menuOpen}
  aria-controls="mobile-menu"
  onClick={() => setMenuOpen(o => !o)}
  className="md:hidden text-primary"
>
```

---

### [WARNING] Links ativos na navbar sem `aria-current`

**Arquivo:** `src/components/Navbar.tsx:15-28`  
**Problema:** Links ativos recebem estilo visual `border-b border-primary` mas nenhum `aria-current="page"`. Screen readers não informam ao usuário qual página está ativa.  
**Fix:**
```tsx
<Link
  to="/properties"
  aria-current={location.pathname === '/properties' ? 'page' : undefined}
  ...
>
```

---

### [WARNING] Botões de + e - no guest selector sem aria-label descritivo

**Arquivos:** `src/components/AvailabilityWidget.tsx:86-99`, `src/pages/PropertyDetail.tsx:121-135`  
**Problema:** Botões com apenas texto "-" e "+" não têm `aria-label`. Screen reader anuncia "button minus" sem contexto de que ação está sendo feita.  
**Fix:** `aria-label="Decrease guest count"` e `aria-label="Increase guest count"`.

---

### [WARNING] Status "Available" animado não tem texto para screen reader

**Arquivo:** `src/components/AvailabilityWidget.tsx:113-115`  
**Problema:** `<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>` é um indicador visual puro sem aria.  
**Fix:** `<span className="sr-only">Status:</span>` antes do span visual, ou `aria-live="polite"` no container.

---

### [WARNING] DateRangePicker: datas desabilitadas sem `aria-disabled`

**Arquivo:** `src/components/DateRangePicker.tsx:140-157`  
**Problema:** `disabled={disabled}` é aplicado nos botões de dia passado, mas o atributo HTML `disabled` em `<button>` já comunica isso para screen readers. Isso está correto para o atributo `disabled`, MAS o botão desabilitado perde focus no teclado — usuários de teclado não conseguem saber por que não conseguem focar nessa data.  
**Fix:** O comportamento atual é tecnicamente correto para `disabled`, mas adicione um `aria-label` descritivo: `aria-label={`${date.getDate()} - past date, unavailable`}`.

---

### [WARNING] Imagens de reviewers têm URL mas são cobertas por div vazia

**Arquivo:** `src/pages/PropertyDetail.tsx:264-266`  
**Problema:**
```tsx
<div className="w-12 h-12 rounded-full bg-surface-variant overflow-hidden">
  <div className="w-full h-full bg-surface-variant"></div>  // cobre a foto
</div>
```
As URLs de avatar do reviewer existem no objeto de dados (linhas 247, 253, 259) mas um `<img>` nunca é renderizado — só uma div cinza. As imagens são invisíveis.  
**Fix:** Renderizar `<img src={review.img} alt={review.name} className="w-full h-full object-cover" />` dentro do container.

---

### [SUGGESTION] Focus ring pode estar ausente em vários botões

**Arquivo:** Geral  
**Problema:** Tailwind v4 com `@import "tailwindcss"` pode não incluir o reset de `outline` padrão ou os estilos de `focus-visible` em todos os elementos interativos. Não há `focus:ring` ou `focus-visible:ring` explícito em nenhum botão do código.  
**Fix:** Adicionar ao `index.css`:
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

# 6. BUGS FUNCIONAIS

---

### ✅ OK FEITO — [CRITICAL] `Crosshair` usado antes de ser declarado em ManagementServices

**Arquivo:** `src/pages/ManagementServices.tsx:43` e `94`  
**Problema:** O array de `services` (linha 27) referencia `Crosshair` na linha 43. O componente `Crosshair` é declarado como `function` na linha 94 — APÓS o corpo do componente principal. Em JavaScript, declarações `function` são içadas (hoisted), então funciona em runtime. Porém em alguns bundlers/transpilers com strict mode ou otimizações, o comportamento pode ser imprevisível. Além disso, `props: any` na linha 94 desativa TypeScript completamente para esse componente.  
**Fix:** Mover `Crosshair` para o topo do arquivo e importar corretamente do Lucide (o ícone se chama `Crosshair` e existe em lucide-react):
```tsx
import { Key, User, ArrowRight, ShieldCheck, Check, Crosshair } from 'lucide-react';
// Remover a definição manual nas linhas 93-115
```

---

### [CRITICAL] `PropertyDetail` e `CollectionDetail` retornam `null` silenciosamente

**Arquivos:** `src/pages/PropertyDetail.tsx:36`, `src/pages/CollectionDetail.tsx:13`  
**Problema:** `if (!property || !unit) return null` — para URLs inválidas (`/properties/xyz/invalid-unit`) o componente renderiza uma página completamente em branco (só Navbar + Footer). Não há mensagem de erro, não há redirect.  
**Fix:**
```tsx
if (!property || !unit) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
      <h1 className="font-display text-headline-md text-primary mb-4">Property not found</h1>
      <p className="font-body text-on-surface-variant mb-8">This listing may have changed or been removed.</p>
      <Link to="/properties" className="border border-primary text-primary px-8 py-4 text-label-caps uppercase">View All Properties</Link>
    </div>
  );
}
```

---

### [WARNING] Hardcode de `top-[214px]` para posição do guest dropdown

**Arquivo:** `src/pages/PropertyDetail.tsx:114`  
**Problema:** `<div className="absolute left-8 right-8 top-[214px] z-50 ...">` — pixel exato hardcoded. Se o conteúdo do card de booking mudar (mais texto, fonte diferente, tamanho diferente), o dropdown vai aparecer fora de posição.  
**Fix:** Usar posicionamento relativo ao elemento trigger:
```tsx
// Envolver o botão de guests num div relative
<div className="relative">
  <button type="button" ...>Guests</button>
  {guestsOpen && (
    <div className="absolute left-0 right-0 top-full mt-2 z-50 ...">
```

---

### [WARNING] DateRangePicker não permite check-in = check-out (mesmo dia)

**Arquivo:** `src/components/DateRangePicker.tsx:94`  
**Problema:** `isSameDate(date, selectedStart)` está na condição de reset — clicar duas vezes na mesma data reseta o check-in em vez de aceitar. Mínimo de 1 noite implícito sem aviso ao usuário.  
**Impacto:** Para check-ins no mesmo dia (raros mas possíveis em hospedagem por hora), o picker é impossível de usar. E o usuário não entende por que clicar na mesma data desfaz sua seleção.

---

### [WARNING] `displayRating` usa fallback hardcoded `'4.98'` para todas as propriedades

**Arquivo:** `src/pages/PropertyDetail.tsx:29`  
**Problema:** `const displayRating = listingMedia?.rating || '4.98'` — toda propriedade sem dados de mídia extrai mostrará "4.98" fabricado. Na seção de reviews (linha 229): `4.98 • 124 reviews` está hardcoded sem variáveis.  
**Impacto:** Dados falsos apresentados como reais ao usuário.

---

### [WARNING] Reviews com datas de 2023 (desatualizadas)

**Arquivo:** `src/pages/PropertyDetail.tsx:244-260`  
**Problema:** Três reviews hardcoded com datas "October 2023", "September 2023", "August 2023" — em 2026 isso parece abandonado ou desatualizado.  
**Fix:** Usar dados reais das avaliações do Airbnb ou pelo menos atualizar as datas.

---

# 7. DADOS HARDCODED / PLACEHOLDERS

---

### ✅ OK FEITO — [CRITICAL] Reviews e avaliações completamente fabricadas

**Arquivo:** `src/pages/PropertyDetail.tsx:242-275`  
**Problema:**
- Nomes: Eleanor R., James T., Sophia M. — inventados
- Datas: Oct/Sep/Aug 2023 — desatualizadas em 2026
- Rating "4.98 • 124 reviews" — hardcoded para TODOS os imóveis
- Fotos de reviewers: URLs do Google que podem expirar/quebrar
- O texto das reviews é genérico e não menciona o imóvel específico que está sendo visto

**Impacto:** Usuário que pesquisa o site percebe reviews genéricas ou nota que Eleanor R. avaliou tanto Chambers quanto Old Trafford — destrói credibilidade.

---

### ✅ OK FEITO — [CRITICAL] Distâncias de vizinhança iguais para todos os imóveis

**Arquivos:** `src/pages/CollectionDetail.tsx:129-139`, `src/pages/PropertyDetail.tsx:293-306`  
**Problema:** CollectionDetail mostra para TODAS as propriedades: City Centre 5min, Deansgate 8min, Etihad 12min, Piccadilly 15min.  
- Para Old Trafford: City Centre não é 5 min walk — é ~25 min de tram
- Para Ancoats: Deansgate não é 8 min walk

PropertyDetail mostra para todos: `{property.area}` 5min, "Spinningfields" 8min, "Victoria Station" 12min — completamente errado para Old Trafford.  
**Fix:** Adicionar campo `distances: Array<{location: string, time: string}>` em cada `Property` em `properties.ts`.

---

### ✅ OK FEITO — [WARNING] Três páginas de serviço/about com hero completamente vazio (div cinza)

**Arquivos:** `src/pages/About.tsx:13-16`, `src/pages/DesignServices.tsx:37-40`, `src/pages/ManagementServices.tsx:7-9`  
**Problema:** Em todas as três páginas há `<div className="w-full h-full bg-surface-variant"></div>` onde deveria haver uma imagem real. São retângulos cinza em produção.  
**Fix:** Usar `MediaImage` com uma imagem genérica de cada propriedade ou remover as seções de imagem até terem conteúdo.

---

### [WARNING] `airbnbInventory.ts` contém `propertySlug`s que não existem em `properties.ts`

**Arquivo:** `src/data/airbnbInventory.ts:45-56`  
**Problema:** O inventário referencia `loom-street`, `newton-street`, `lockgate-mews`, `sezas`, `crusader`, `mm2`, `spinning-mills`, `popworks` — nenhum desses slugs existe em `properties.ts`. A função `getInventoryForProperty('ancoats')` agrupa esses slugs, mas as URLs `/collection/loom-street` não existem no roteador.  
**Impacto:** Os dados existem mas não são navegáveis — gap entre o inventário real e o que o site expõe.

---

### [WARNING] `ancoats-city-loft-balcony` em properties.ts tem specs incorretas

**Arquivo:** `src/data/properties.ts:336`  
**Problema:** `specs: "2 bedrooms / balcony"` — specs deveriam incluir número de banheiros, número de hóspedes, seguindo o padrão dos outros units. "balcony" não é uma especificação do mesmo tipo.

---

### [SUGGESTION] URL do Airbnb para `jds-1` sem `www`

**Arquivo:** `src/data/airbnbInventory.ts:12`  
**Problema:** `'https://airbnb.com/h/jds-1'` — URLs sem `www` redirecionam mas o padrão do inventário é inconsistente: algumas têm `www.airbnb.com`, outras `airbnb.com`, outras `airbnb.co.uk`, outras `www.airbnb.co.uk`. Para deep links ao Airbnb, usar sempre a URL final `finalUrl` do JSON gerado.

---

# 8. COMPONENTES / CÓDIGO

---

### [WARNING] Properties.tsx é cópia quase literal de Home.tsx (300+ linhas duplicadas)

**Arquivos:** `src/pages/Home.tsx` e `src/pages/Properties.tsx`  
**Problema:** As seis seções de feature de propriedade (Chambers, JDS, Wood Street, Ancoats, Trafford, The Collective) são duplicadas com cópia e cola entre os dois arquivos. Qualquer mudança de copy, imagem ou estilo precisa ser feita duas vezes.  
**Impacto:** Manutenção cara, risco de divergência entre páginas.  
**Fix:** Extrair um componente `PropertyFeatureSection`:
```tsx
type PropertyFeatureSectionProps = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  layout?: 'left' | 'right';
  quoteText?: string;
};

function PropertyFeatureSection({ slug, name, eyebrow, description, ctaLabel, ctaHref, layout = 'left', quoteText }: PropertyFeatureSectionProps) {
  // ...renderiza o padrão correto baseado em layout
}
```

---

### [WARNING] Lógica de booking duplicada entre AvailabilityWidget e PropertyDetail

**Arquivos:** `src/components/AvailabilityWidget.tsx` e `src/pages/PropertyDetail.tsx:30-155`  
**Problema:** Ambos implementam independentemente: estado de checkIn/checkOut, estado de guests, abertura/fechamento do DateRangePicker, abertura/fechamento do guest dropdown. Código quase idêntico em dois lugares.  
**Fix:** Extrair um hook `useBookingState(maxGuests: number)` que retorne todos os estados e handlers.

---

### [WARNING] `ManagementServices.tsx` define componente no final do arquivo após o uso

**Arquivo:** `src/pages/ManagementServices.tsx:94-115`  
**Problema:** `function Crosshair(props: any)` definido na linha 94 após o uso na linha 43. Funciona por hoisting em JS mas é antipadrão e causa lint warnings. O tipo `any` em `props` desativa TypeScript.  
**Fix:** Importar `Crosshair` do `lucide-react` (existe com esse nome) no topo do arquivo.

---

### [WARNING] `getPropertyBySlug` tem lógica de legacy IDs numéricos não documentada

**Arquivo:** `src/data/properties.ts:386-404`  
**Problema:** A função aceita slugs como "1", "2", "3" (IDs legados) e também slugs de texto. A lógica de `Number.isInteger(numericIndex)` na linha 399 é executada mesmo depois de resolver o legacyCollectionIds — significa que `"chambers"` vai passar pelo path de ID numérico sem efeito, mas é confuso.  
**Fix:** Separar claramente as duas modalidades com comentários ou dividir em duas funções.

---

### [SUGGESTION] `ScrollToTop` não está sendo usado em `App.tsx`

**Arquivo:** `src/main.tsx:6`, `src/App.tsx`  
**Problema:** `ScrollToTop` é importado e usado em `main.tsx` (linha 6, mas referenciado como `<ScrollToTop />` na linha 11) — mas olhando App.tsx, o ScrollToTop está em main.tsx dentro do BrowserRouter, o que funciona. OK, está correto. Mas a função `behavior: 'auto'` no ScrollToTop.tsx (linha 8) é o scroll imediato — considere se `behavior: 'smooth'` seria melhor UX.

---

### [SUGGESTION] MediaImage não tem `onError` fallback

**Arquivo:** `src/components/MediaImage.tsx:26`  
**Problema:** `<img src={imageSrc} alt={alt} .../>` — se a imagem do Airbnb (muscache CDN) falhar/expirar, o browser mostra o ícone de imagem quebrada.  
**Fix:**
```tsx
<img
  src={imageSrc}
  alt={alt}
  className={className}
  loading={loading}
  onError={(e) => { e.currentTarget.style.display = 'none'; }}
/>
```

---

### [NITPICK] Variável `isDarkBg` declarada e nunca usada

**Arquivo:** `src/components/Navbar.tsx:6`  
**Problema:** `const isDarkBg = location.pathname.includes('/contact') || location.pathname.includes('/about')` — calculada mas não aplicada em nenhum lugar. Feature incompleta ou esquecida.  
**Fix:** Remover a variável ou implementar a lógica (ex: mudar a cor do texto da navbar em páginas dark).

---

# 9. SEO

---

### ✅ OK FEITO — [CRITICAL] Zero meta tags de SEO em todo o site

**Arquivo:** `index.html:1-9`  
**Problema:** O `<head>` contém apenas charset, viewport e title. Completamente ausentes:
- `<meta name="description" content="...">`
- `<meta property="og:title" ...>`
- `<meta property="og:description" ...>`
- `<meta property="og:image" ...>`
- `<meta name="twitter:card" ...>`
- `<link rel="canonical" ...>`

**Impacto:** Google não tem descrição para exibir nos resultados. Quando o link é compartilhado no WhatsApp/Telegram/LinkedIn, não há preview de imagem nem descrição.  
**Fix mínimo:** Instalar `react-helmet-async` e adicionar por página:
```tsx
import { Helmet } from 'react-helmet-async';

// Em Home.tsx:
<Helmet>
  <title>MCRh | Luxury Short-Let Apartments in Manchester</title>
  <meta name="description" content="Premium short-term furnished apartments in Manchester city centre. Chambers, Ancoats, Wood Street and more." />
  <meta property="og:title" content="MCRh | Luxury Short-Let Apartments in Manchester" />
  <meta property="og:image" content="/media/properties/chambers/01.jpeg" />
</Helmet>
```

---

### ✅ OK FEITO — [CRITICAL] Title idêntico em todas as rotas

**Arquivo:** `index.html:5`  
**Problema:** Todas as páginas têm o mesmo `<title>MCRh | Manchester Short-Let Apartments</title>` porque o title nunca é alterado por rota. Google desvaloriza sites com múltiplas páginas com o mesmo title.

---

### [WARNING] Dois H1 com texto idêntico em páginas diferentes

**Arquivos:** `src/pages/Home.tsx:26`, `src/pages/Properties.tsx:15`  
**Problema:** Ambas têm `<h1>Experts In Short-Term Lettings</h1>`. Google pode confundir qual página rankear para essa query.  
**Fix:** Home mantém o H1 genérico. Properties deveria ter `<h1>Manchester Short-Let Properties</h1>` ou similar.

---

### [WARNING] Alt texts genéricos e repetidos

**Arquivos:** `src/pages/Home.tsx:21`, `src/pages/Properties.tsx:10`  
**Problema:** `alt="MCRh Manchester apartment interior"` é o mesmo texto em imagens de propriedades completamente diferentes. Alt texto deveria ser descritivo e único por imagem.  
**Fix:** `alt="Chambers Residence — living room with industrial heritage details"` etc.

---

### [WARNING] Nenhuma tag H1 visível em ManagementServices enquanto há conteúdo relevante

**Arquivo:** `src/pages/ManagementServices.tsx`  
**Problema:** O H1 `<h1 ...>Effortless Yield Management</h1>` existe (linha 12) mas está sobre um fundo `bg-surface-variant` cinza — se o texto tem contraste insuficiente com esse fundo, ou se o hero for tratado como decorativo, o H1 efetivo da página para SEO pode ser o H2 da próxima seção.

---

### [SUGGESTION] Sem sitemap.xml, sem robots.txt

**Problema:** Não há geração de sitemap no projeto. Google não sabe quais rotas existem (especialmente as rotas dinâmicas `/collection/:id` e `/properties/:propertySlug/:id`).  
**Fix mínimo:** Criar `public/sitemap.xml` estático com as URLs conhecidas; ou usar `vite-plugin-sitemap`.

---

### [SUGGESTION] `<html lang="en">` mas existe conteúdo em rotas PT-BR

**Arquivo:** `index.html:2`  
**Problema:** `/sobre`, `/propriedades`, `/contacto` são rotas em português mas o documento inteiro está marcado como `lang="en"`. Motores de busca indexam esses URLs com o idioma errado.  
**Fix:** Implementar `react-helmet-async` para alterar `lang` por rota, ou decidir um idioma único para o site.

---

# 10. PERFORMANCE

---

### [WARNING] Imagens sem dimensões causam CLS (Cumulative Layout Shift)

**Arquivo:** `src/components/MediaImage.tsx:26`  
**Problema:** `<img src={imageSrc} alt={alt} className={className} loading={loading} />` — sem atributos `width` e `height`. O browser não sabe o tamanho antes de carregar a imagem, causando layout shift ao carregar.  
**Impacto:** CLS alto prejudica a pontuação do Core Web Vitals do Google.  
**Fix:** Para imagens que preenchem 100% do container pai, o container deve ter dimensão fixa definida (ex: `aspect-ratio`) antes da imagem carregar. Verificar que todos os wrappers de MediaImage têm `aspect-[x/y]` ou altura fixa.

---

### [WARNING] Google Fonts carregado via `@import` em CSS (bloqueante)

**Arquivo:** `src/index.css:1`  
**Problema:** `@import url('https://fonts.googleapis.com/css2?...')` dentro de CSS é bloqueante para o render — o browser precisa baixar o CSS, encontrar o import, fazer outro request para o Google, e só então renderizar.  
**Fix:** Mover para `index.html` com preconnect:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&family=Playfair+Display:wght@400;600;700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&family=Playfair+Display:wght@400;600;700&display=swap">
```

---

### [WARNING] `getMonthDays` em DateRangePicker sem `useMemo`

**Arquivo:** `src/components/DateRangePicker.tsx:89`  
**Problema:** `const monthDays = getMonthDays(visibleMonth)` é recalculado em todo re-render. O DateRangePicker pode re-renderizar frequentemente (a cada clique de data atualiza o state do pai).  
**Fix:**
```tsx
const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
```

---

### [WARNING] `visibleLocations` recalculado sem memo em Home

**Arquivo:** `src/pages/Home.tsx:12-14`  
**Problema:** `const visibleLocations = mapLocations.filter(...)` é recalculado a cada render de `Home`. Home tem vários estados (`filtersOpen`, `selectedArea`, `selectedLocationId`, `mapZoom`) que causam re-renders.  
**Fix:**
```tsx
const visibleLocations = useMemo(
  () => mapLocations.filter(loc => selectedArea === 'all' || loc.areaId === selectedArea),
  [selectedArea]
);
```

---

### [SUGGESTION] Imagens do Airbnb CDN sem parâmetro de dimensão consistente

**Arquivo:** `src/data/airbnbListings.generated.json`  
**Problema:** As URLs do Airbnb CDN têm `?im_w=720&width=720&quality=70` em algumas mas não nas `imageUrls` do array. Imagens sem parâmetros podem ser carregadas em resolução máxima (~5MB cada).  
**Fix:** Ao processar as URLs em `getListingMedia`, adicionar `?im_w=720&quality=75` às URLs que não têm parâmetros.

---

### [NITPICK] `import path from 'path'` em vite.config.ts não tem type definition

**Arquivo:** `vite.config.ts:3`  
**Problema:** Uso de `path.resolve` sem `@types/node` importado explicitamente. Funciona se `@types/node` está no devDependencies mas não está explicitamente listado.

---

# Positivos

- **Design system coeso:** Os tokens em `index.css` (surface, on-surface, primary, secondary etc.) são bem pensados e formam uma base sólida. O uso de `@theme` do Tailwind v4 para definir tokens semânticos é moderno e correto.
- **`MediaImage` com fallback gracioso:** Retorna um `<div>` cinza quando a imagem não existe — sem erros visuais de imagem quebrada.
- **`DateRangePicker` bem implementado:** Lógica de calendário pura sem dependências externas, com prevenção de datas passadas, seleção de range, e format utilities bem separadas.
- **`ScrollToTop` bem posicionado:** Dentro do `BrowserRouter` em `main.tsx`, garante que toda navegação começa do topo.
- **`locations.ts` com coordenadas reais e conversão para posição em CSS:** A função `toMapPosition` que converte coordenadas lat/lng para % de posição no mapa é elegante.
- **`airbnbListings.generated.json` com dados reais extraídos:** A integração de dados reais do Airbnb via script de extração é uma boa abordagem.
- **Estrutura de rotas bilíngue preparada:** As rotas duplicadas em PT (`/propriedades`, `/sobre`) mostram previsão para internacionalização.
- **`getUnitGallery` com deduplicação:** `uniqueImages` em `listingMedia.ts` garante que a galeria de um imóvel não mostra fotos duplicadas.

---

# Ordem de Correção Recomendada

| Prioridade | Issue | Arquivo |
|-----------|-------|---------|
| 🔴 1 | Menu mobile inoperante | Navbar.tsx |
| 🔴 2 | "Reserve Now" sem ação | PropertyDetail.tsx |
| 🔴 3 | "Enquire Now" sem ação | DesignServices.tsx |
| 🔴 4 | Formulário de contato não envia | Contact.tsx |
| 🔴 5 | Widget sempre mostra "Available" | AvailabilityWidget.tsx |
| 🔴 6 | Labels de form sem htmlFor/id | Contact.tsx |
| 🔴 7 | Meta tags SEO ausentes | index.html + react-helmet-async |
| 🔴 8 | Reviews/ratings hardcoded falsas | PropertyDetail.tsx |
| 🟡 9 | Botões mortos (gallery, amenities, slider) | PropertyDetail.tsx |
| 🟡 10 | Placeholders cinza em About/Design/Management | 3 páginas |
| 🟡 11 | Distâncias de vizinhança erradas por imóvel | CollectionDetail + PropertyDetail |
| ✅ 12 | Dropdowns sem click-outside | Home, AvailabilityWidget, PropertyDetail | ✅ OK FEITO |
| 🟡 13 | Booking card overlap em mobile | PropertyDetail.tsx |
| 🟡 14 | Crosshair importar do lucide (remover função manual) | ManagementServices.tsx |
| 🟡 15 | scrollbar-hide definir no CSS | index.css |
| 🟡 16 | Copyright 2024 desatualizado | Footer.tsx |
| 🟡 17 | Hero heights fixas em px (mobile) | PropertyDetail + Properties |
| 🟡 18 | Imagens sem dimensões (CLS) | MediaImage.tsx |
| 🟡 19 | Google Fonts via @import (bloqueante) | index.css → index.html |
| 🟢 20 | Extrair PropertyFeatureSection (dedup) | Home + Properties |
| 🟢 21 | useMemo em monthDays e visibleLocations | DateRangePicker + Home |
| 🟢 22 | Página 404 | App.tsx |
| 🟢 23 | focus-visible styles | index.css |
| 🟢 24 | Sitemap.xml | public/ |

---
---

# 11. ADMIN / BACK-END — Review e Plano de Implementação
**Adicionado:** 2026-07-14
**Escopo:** `server/` (Express + Supabase), `supabase/migrations/`, `src/pages/Admin.tsx`,
hooks `useSiteContent`/`usePublicUnits`, e o *wiring* das páginas públicas.
**Contexto:** o review original (jun/15) é sobre o site estático. Desde então nasceu o
painel `/admin` com back-end próprio. Esta seção cobre esse código novo e o que falta
para **finalizar o projeto** (editar 100% de texto/imagem/links + ligar/desligar imóveis).

> **Estado atual (Fase A):** login por senha + JWT, aba **Apartamentos** (nome, título de
> exibição, specs, link Airbnb, visível, destaque na home + ordem, fotos com upload/reordenar/
> capa/alt/excluir, auto-ocultar quando "não listado" no Airbnb), aba **Imagens** (5 slots
> de hero) e aba **Conteúdo** (hero/stats/depoimentos da Home, menu, contato, rodapé, heróis
> das páginas de serviço). Typecheck ✅ e build ✅. **7 arquivos ainda não commitados** (o
> polimento final da fase). Fundação de dados: `SiteContent`, `SiteImage`, `MediaAsset`.

## 11.1 Achados de code review (back-end/admin)

### [WARNING] RLS não habilitado nas tabelas novas
**Arquivos:** `supabase/migrations/001,002,003`
**Problema:** `MediaAsset`, `SiteImage`, `SiteContent` são criadas sem `ENABLE ROW LEVEL SECURITY`.
A escrita passa 100% pela API com **service key** (correto), mas se a **anon key** estiver
exposta no browser com acesso a essas tabelas, há risco de leitura/escrita direta.
**Ação:** confirmar no painel Supabase que RLS está ligado; policies: leitura pública só do
público, escrita só via service role. Adicionar migration `004_rls.sql` explícita.

### [WARNING] Campos no allowlist do servidor sem input na UI
**Arquivos:** `server/admin.js:39` (`EDITABLE`) × `src/pages/Admin.tsx` (`UnitCard`)
**Problema:** o servidor aceita editar `postcode`, `description`, `squareFeet`, mas a UI de
apartamento só renderiza `unitName`, título de exibição, `suppliedSpecs`, `airbnbUrl`.
**Ação:** ou remover do allowlist, ou (melhor) adicionar os campos na UI. Ver Fase 0.3.

### [WARNING] iCal não editável pelo admin
**Arquivos:** `server/sync.js`, `scripts/seed-ical-urls.cjs`
**Problema:** `icalAirbnbUrl`/`icalVrboUrl` (alimentam a disponibilidade) só são definidos via
script de seed; se um link mudar, exige mexer em código. Não estão no allowlist nem na UI.
**Ação:** adicionar ao `EDITABLE` + campos na UI (com validação de URL). Ver Fase 0.4.

### [SUGGESTION] Reorder de fotos faz N `await` sequenciais
**Arquivo:** `server/admin.js:143` (`/photos/reorder`)
**Problema:** um `UPDATE` por foto em loop. Ok para poucas fotos; ineficiente se crescer.
**Ação:** trocar por um `upsert` em lote (uma chamada). Baixa prioridade.

### [SUGGESTION] Rate-limit e sessão em memória (single-instance)
**Arquivo:** `server/admin.js` (`attempts` Map)
**Problema:** o throttle de login e a contagem resetam a cada restart e não são
compartilhados entre instâncias. Aceitável para 1 instância; anotar se escalar.

### [NITPICK] `window.prompt`/`confirm` para alt e exclusão
**Arquivo:** `src/pages/Admin.tsx` (`editAlt`, `onDelete`)
**Problema:** UX cru e bloqueante. Funciona; trocar por modal quando sobrar tempo.

### [INFO] Validação de payload sem schema (Zod)
As rotas de escrita confiam no allowlist mas não validam formato (URL/número). O roadmap
prevê Zod no autosave para "não gravar lixo". Recomendado ao abrir a aba Propriedades.

**Positivos:** service key só no servidor; frontend com cache + *fallback* aos dados estáticos
(o site nunca quebra se a API cair); `hiddenSlugs` explícito (nunca infere ocultação por
ausência); `visible` manual separado de `airbnbListed` automático (uma automação nunca
sobrepõe um "ocultar" manual); body-limit por rota; `timingSafeEqual` no login.

## 11.2 Plano de implementação (para finalizar o projeto)

> Detalhamento **item por item** (chave de dados, UI, página a religar) está em
> `ADMIN_CONTENT_INVENTORY.md` → seção "PLANO DE EXECUÇÃO". Resumo técnico por fase:

**Fase 0 — Fechar a Fase A** *(rápido, destrava o resto)*
- [ ] Commitar os 7 arquivos pendentes (rate-limit, body-limit, nav/footer/home wiring).
- [ ] Migration `004_rls.sql` + confirmar RLS no Supabase.
- [ ] Campos `postcode`/`description`/`squareFeet` na UI do apê.
- [ ] iCal (`icalAirbnbUrl`/`icalVrboUrl`) no allowlist + UI, com validação de URL.

**Fase B — Conteúdo profundo das propriedades** *(maior volume de texto)*
- [ ] Nova aba **Propriedades** (editor por coleção): `property.<slug>.*` em `SiteContent`
      (name, area, eyebrow, headline, description, quote, specs, neighborhoodTitle).
- [ ] Amenidades (`property.<slug>.amenities`) e distâncias (`property.<slug>.nearby`) via `ListEditor`.
- [ ] **Reviews**: migration `Review` + rotas `/api/admin/reviews` e `/api/content/reviews` +
      UI CRUD (nota editável — hoje fixa "5.0"/"4.98"). *Resolve #8 e #48 do review original.*
- [ ] Galeria por coleção via `MediaAsset(ownerType='property')` (tabela já suporta).
- [ ] Religar `CollectionDetail`/`PropertyDetail` para ler do banco; galeria do apê usar as
      fotos do admin em vez do scrape do Airbnb.

**Fase C — Corpo das páginas institucionais** *(mecânico: add chave + trocar texto por leitura)*
- [ ] Home: texto/imagem dos **6 blocos** (`home.blocks`, `home.block.<slug>`).
- [ ] Design: `design.approach.*`, `design.disciplines.*`, `design.cta.*`.
- [ ] Management: `management.services.*`, `management.reporting.*`, `management.partner.*`.
- [ ] About: `about.philosophy.*`, `about.quote.*`.
- [ ] Properties: `properties.title`.

**Fase D — SEO, Mapa, Disponibilidade, Leads**
- [ ] SEO por página (`seo.<page>`, `seo.property.<slug>`) — **`react-helmet-async` já instalado e em
      uso; meta tags já existem em todas as páginas (estáticas).** #7 do review já ✅. Falta só ler do
      SiteContent em vez do texto fixo — não recriar a infra.
- [ ] Pins do mapa editáveis (`MapLocation` ou `map.locations`) com editor visual de lat/lng.
- [ ] Painel de disponibilidade + botão "Sincronizar agora" (`POST /api/sync`, já existe).
- [ ] Aba **Leads**: persistir envios em `Enquiry` (tabela já existe) + inbox novo/lido/arquivado.

## 11.3 Ordem de correção — back-end/admin

| Prioridade | Issue | Onde |
|-----------|-------|------|
| 🔴 A1 | Commitar Fase A pendente | git (7 arquivos) |
| 🔴 A2 | RLS nas tabelas novas | migration `004` + Supabase |
| 🟡 A3 | Campos postcode/description/squareFeet na UI | Admin.tsx `UnitCard` |
| 🟡 A4 | iCal editável (allowlist + UI + validação) | admin.js + Admin.tsx |
| 🟡 A5 | Aba Propriedades (texto/amenidades/distâncias) | Admin.tsx + content.js |
| 🟡 A6 | Reviews (tabela + CRUD + wiring) | migration + server + páginas |
| 🟡 A7 | Galeria por coleção | Admin.tsx + CollectionDetail |
| 🟢 A8 | Corpo das páginas (Design/Management/About/Home blocks) | SiteContent + páginas |
| 🟢 A9 | SEO por página **editável** (Helmet já existe e funciona) | SiteContent + páginas |
| 🟢 A10 | Mapa editável | migration/SC + PropertyMap |
| 🟢 A11 | Aba Leads (Enquiry) | server + Admin.tsx |
| 🟢 A12 | Validação Zod nas rotas de escrita | server |
| 🟢 A13 | Reorder de fotos em lote / modais no lugar de prompt | server + Admin.tsx |
