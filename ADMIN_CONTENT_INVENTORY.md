# Inventário completo de conteúdo editável — MCRh

> Levantamento **página por página** de tudo que pode/deve ser editável pelo `/admin`.
> Objetivo: fechar o "tá incompleto". Legenda:
> **✅ já no admin** · **🟡 no banco mas sem UI ainda** · **❌ estático (hardcoded), falta tudo**
>
> **Atualização 2026-07-14:** a Fase A entregou as abas **Imagens** e **Conteúdo**, então
> vários itens antes ❌ agora são ✅. Os status abaixo foram revisados. O **plano detalhado
> do que ainda falta** está no final do arquivo ("PLANO DE EXECUÇÃO").

O admin hoje cobre **apartamentos** (nome, título de exibição, specs, link Airbnb, visível,
destaque, fotos), **imagens de capa/hero** (5 slots) e **conteúdo global** (hero da Home,
stats, depoimentos, menu, contato, rodapé, heróis das páginas de serviço). Tudo marcado
❌/🟡 abaixo ainda NÃO dá pra editar. É isso que falta construir.

---

## 0. Conceitos que faltam no back-end (a raiz do "incompleto")

Hoje só existe o modelo de **Unit** (apartamento). Para editar o resto, faltam duas peças:

- **🖼️ Slots de imagem nomeados (`SiteImage`)** — as fotos de capa/hero das páginas
  (Home, About, Design, Management) hoje vêm de `MediaImage propertySlug="chambers" index=N`,
  ou seja, puxam de um apartamento/Airbnb. Para você trocar "a foto de capa da página
  principal" ou "a imagem da página de design" por **qualquer** imagem, precisa de um
  registro por slot: `home.hero`, `design.hero`, `design.approach`, `about.hero`, etc.
  O admin sobe uma imagem e ela sobrepõe o default.
- **📝 Blocos de texto/número/link (`SiteContent`)** — um armazém chave→valor para todo
  texto, número e link fixo (títulos, parágrafos, stats, e-mail, endereço, links do rodapé).

Com essas duas peças + o Unit que já existe, dá pra cobrir 100% do site.

---

## 1. 🌐 Global (aparece em todas as páginas)

| Item | Onde | Status |
|---|---|---|
| Logo "MCRh" (texto) | Navbar + Footer | ✅ (`brand.name`) |
| Links do menu (Properties, Design, Management, About, Contact) | Navbar | ✅ (`nav.links` + CTA) |
| Links do rodapé: **Privacy, Terms, Sustainability, Careers** | Footer | ✅ (`footer.links`) |
| Texto de copyright | Footer | ✅ (`footer.copyright`; ano automático) |
| Redes sociais (Instagram, etc.) | Footer | ✅ (`footer.social`) |

## 2. 🏠 Home (`/`)

| Item | Detalhe | Status |
|---|---|---|
| **Foto de capa (hero)** | slot `home.hero` | ✅ (aba Imagens) |
| Título do hero | "Experts In Short-Term Lettings" | ✅ (`home.hero.title`) |
| Subtítulo do hero | "The first choice for property rentals…" | ✅ (`home.hero.subtitle`) |
| Botão do hero | "EXPLORE PROPERTIES" → `/properties` | ✅ (`home.hero.ctaLabel/ctaHref`) |
| **6 blocos de destaque** (Chambers, John Dalton, Wood St, Ancoats, Trafford, The Collective) | **quais apês** = ✅ (`home.featured`+ordem); **texto/imagem de cada bloco** = ❌ | 🟡 (ver Fase C1) |
| Título da seção do mapa | "Discover Our Locations" | ✅ (`home.map.title`) |
| Pins do mapa (nome, área, postcode, coordenadas) | `locations.ts` | 🟡 (ver Fase D2) |
| **Números/stats** | "30+ Properties", "500+ Guest Reviews", "100% 5-Star", "7 Neighbourhoods" | ✅ (`home.stats`) |
| Seção "Guest Experiences" | título + **3 depoimentos** | ✅ (`home.testimonials*`) |
| SEO | title, description, og:image, twitter:card | 🟡 já existe **estático** (Helmet) — falta editar (Fase D1) |

## 3. 🔎 Properties (`/properties`)

| Item | Status |
|---|---|
| Lista de apartamentos (nome, specs, link, foto, ocultar) | ✅ |
| Título "Find Property" | ❌ |
| SEO (title, description) | 🟡 estático (Helmet), falta editar |

## 4. 🏢 Página da coleção (`/collection/:slug`) — 6 propriedades

Tudo isto vem de `properties.ts` (estático) e **não é editável**:

| Item | Status |
|---|---|
| Nome, área, eyebrow, headline, descrição, citação | ❌ |
| Nº de quartos / camas / banheiros / hóspedes | ❌ |
| Amenidades (lista) | ❌ |
| Título do bairro + **"distâncias"** (ex.: "Deansgate Station — 4 min walk") | ❌ |
| Galeria de fotos da propriedade | ❌ (hero) / ✅ (fotos por apê) |
| Apartamentos da coleção (nome, foto, ocultar) | ✅ |
| Reviews da propriedade (nome, data, texto) — `reviews.ts` | ❌ |
| SEO por propriedade | 🟡 já dinâmica dos dados (Helmet), falta ser editável separadamente |

## 5. 🛏️ Página do apartamento (`/property/:prop/:unit`)

| Item | Status |
|---|---|
| Galeria do apê (hoje vem do scrape do Airbnb) | ❌ (as fotos do admin ainda não substituem aqui) |
| Nome, specs, descrição | 🟡 (editável no admin, mas esta página ainda lê estático) |
| Amenidades / reviews / mapa / distâncias | ❌ |

## 6. 🎨 Design Services (`/design-services`) — **tudo hardcoded**

| Item | Status |
|---|---|
| **Imagem do hero** (slot `design.hero`) | ✅ (aba Imagens) |
| Eyebrow "MCRh Studio", título, parágrafo do hero | ✅ (`design.hero.*`) |
| Seção "Our Approach": eyebrow, título, 2 parágrafos, **3 bullets** | ❌ (imagem `design.approach` ✅ — ver Fase C2) |
| Seção "Core Disciplines": título, subtítulo, **3 cards** (título + descrição) | ❌ |
| CTA final: título, parágrafo, **botão + link** | ❌ |
| SEO (title/description/og) | 🟡 já existe **estático** via `react-helmet-async` — falta tornar editável (Fase D1) |

## 7. 🛎️ Management Services (`/management-services`) — **tudo hardcoded**

| Item | Status |
|---|---|
| **Imagem do hero** (slot `management.hero`) | ✅ (aba Imagens) |
| Eyebrow, título, parágrafo do hero | ✅ (`management.hero.*`) |
| "Service Architecture": eyebrow, título, **4 cards de serviço** (título + descrição) | ❌ |
| "Transparent Reporting": título, parágrafo, **4 bullets** | ❌ |
| Card "Partner Criteria": título, intro, **3 bullets** | ❌ |
| SEO (title/description/og) | 🟡 já existe **estático** via `react-helmet-async` — falta tornar editável (Fase D1) |

## 8. ℹ️ About (`/about`) — **tudo hardcoded**

| Item | Status |
|---|---|
| Eyebrow "Our Story", título grande | ✅ (`about.hero.eyebrow/title`) |
| **Imagem** (slot `about.hero`) | ✅ (aba Imagens) |
| "The Philosophy": título + **3 parágrafos** | ❌ (ver Fase C4) |
| Bloco de citação + assinatura ("The Founders") | ❌ |
| SEO (title/description/og) | 🟡 já existe **estático** via `react-helmet-async` — falta tornar editável (Fase D1) |

## 9. ✉️ Contact (`/contact`)

| Item | Detalhe | Status |
|---|---|---|
| Título + parágrafo de intro | | ✅ (`contact.intro`) |
| **E-mail** | contact@mcrh.co.uk | ✅ (`contact.email`) |
| **Endereço** | Chambers Building / Deansgate / Manchester M3 3EW / UK | ✅ (`contact.address`) |
| Telefone / WhatsApp | | ✅ (`contact.phone` / `contact.whatsapp`) |
| Destino do formulário | Formspree fixo (`xkgjeqvb`) — leads **não são salvos** | ❌ (ver Fase D4) |
| Caixa de leads (ver os contatos recebidos) | tabela `Enquiry` já existe, vazia | 🟡 |

---

## Resumo: o que construir para ficar completo

O admin tem **3 grandes áreas** — as 3 primeiras já existem (Fase A). Faltam 2 módulos:

1. **Apartamentos** ✅ (feito) — nome, título de exibição, specs, link Airbnb, ocultar,
   destaque, fotos.
   - Falta: refletir também na página de detalhe individual (item 5) e campos `postcode`/
     `description`/`squareFeet`/iCal na UI (Fase 0).
2. **🖼️ Imagens do site** ✅ (feito, parcial) — slots de hero de Home/Design/Management/About.
   - Falta: galerias por **coleção** e imagens dos **6 blocos** da Home (Fase B5/C1).
3. **📝 Conteúdo & textos** ✅ (feito, parcial) — hero/stats/depoimentos da Home, menu,
   contato, rodapé/redes, heróis das páginas de serviço.
   - Falta: corpo das páginas (Design/Management/About), reviews, amenidades, distâncias,
     SEO (Fases B/C/D).
4. **🏢 Propriedades/coleções** ❌ (nova aba) — nível acima do apartamento: nome, descrição,
   citação, specs, amenidades, distâncias, reviews, galeria. (Fase B.)
5. **📥 Leads** ❌ (nova aba) — inbox dos contatos recebidos (item 9). (Fase D4.)

> **Detalhamento completo, item por item, com chave de dados / UI / página a religar:
> ver "PLANO DE EXECUÇÃO" no final deste arquivo.**

---

## Nota sobre o estilo do painel
~~O `/admin` atual está com visual "cru" (inputs simples).~~ **✅ FEITO** — o painel já
foi refeito no visual do site (Quiet Luxury: paleta creme/grafite, tipografia display,
cards refinados) e organizado em **abas por área**. Abas existentes hoje:
**Apartamentos · Imagens · Conteúdo**. Faltam as abas **Propriedades** e **Leads**
(detalhadas no plano abaixo).

---

# ═══════════════════════════════════════════════════════════════════
# PLANO DE EXECUÇÃO — o que ainda falta construir
# (atualizado 2026-07-14)
# ═══════════════════════════════════════════════════════════════════

> **Contexto:** a Fase A entregou a fundação certa — `SiteContent` (chave→valor jsonb),
> `SiteImage` (slots de imagem) e `MediaAsset` (galerias por dono). Por causa disso,
> **a maior parte do que falta é aditivo e de baixo risco**: adicionar uma chave/slot,
> um campo na UI de admin e trocar o texto fixo da página por uma leitura. Só Reviews,
> mapa e leads exigem tabela nova.

## Legenda de mecanismo de dados
| Marca | Significado | Já existe a infra? |
|---|---|---|
| **SC[`key`]** | `SiteContent` — chave→valor jsonb. Add chave + campo na aba Conteúdo + `text()`/`list()` na página | ✅ sim |
| **IMG[`slot`]** | `SiteImage` — slot de imagem. Add slot em `IMAGE_SLOTS` (Admin.tsx) + `site.images['slot']` na página | ✅ sim |
| **MEDIA(property)** | `MediaAsset` com `ownerType='property'` — galeria por coleção | ✅ tabela já suporta |
| **TABELA** | precisa de **migration nova** | ❌ criar |

## Padrão de wiring (para todo item SC/IMG)
1. **Seed** do valor atual (o texto/imagem hardcoded de hoje) na tabela — para não "sumir" nada.
2. **Campo** na aba correspondente do `Admin.tsx` (`StringField`, `ListEditor` ou slot de imagem).
3. **Leitura** na página com fallback ao default: `text(site.content, 'key', 'Texto atual')`.
4. A página **já usa** `useSiteContent()`? Se não, importar o hook (custo baixo).

---

## ▸ FASE 0 — Fechar a Fase A (pendências rápidas)

| # | Item | Peça | Onde | Observação |
|---|---|---|---|---|
| 0.1 | ✅ Commitar os 7 arquivos pendentes | — | git | rate-limit, body-limit, nav/footer/home wiring |
| 0.2 | ✅ Confirmar **RLS** ligado nas tabelas novas | Supabase | `MediaAsset`, `SiteImage`, `SiteContent` | migrations não habilitam RLS |
| 0.3 | ✅ Campos de apê que existem no back-end mas **não têm input** | UI | `UnitCard` (Admin.tsx) | `postcode`, `description`, `squareFeet` já estão no allowlist do servidor |
| 0.4 | ✅ **iCal editável** por unidade | UI + allowlist | `UnitCard` + `EDITABLE` (admin.js) | `icalAirbnbUrl`, `icalVrboUrl` — hoje só via `scripts/seed-ical-urls.cjs` |

---

## ▸ FASE B — Conteúdo profundo das propriedades (o maior volume de texto)

> Origem hoje: `src/data/properties.ts` (860 linhas), `src/data/reviews.ts`.
> **Nova aba de admin: "Propriedades"** — um editor por coleção (as 6: Chambers,
> John Dalton, Wood St, Ancoats, Trafford, The Collective).

### B1. Campos de texto/número da coleção
Por coleção `<slug>` (ex.: `chambers`, `john-dalton-st`, `wood-st`, `ancoats`, `trafford`, `the-collective`):

| Campo | Mecanismo | Chave sugerida |
|---|---|---|
| Nome | SC | `property.<slug>.name` |
| Área / bairro | SC | `property.<slug>.area` |
| Eyebrow | SC | `property.<slug>.eyebrow` |
| Headline | SC | `property.<slug>.headline` |
| **Descrição** | SC (textarea) | `property.<slug>.description` |
| **Citação** | SC (textarea) | `property.<slug>.quote` |
| Nº hóspedes / quartos / camas / banheiros | SC | `property.<slug>.specs` → `{maxGuests,bedrooms,beds,bathrooms}` |
| Título do bairro | SC | `property.<slug>.neighborhoodTitle` |

### B2. Amenidades (lista editável — add/remover/reordenar)
- **SC[`property.<slug>.amenities`]** = `string[]`. UI: `ListEditor` (1 coluna).

### B3. Distâncias / "nearby" (pares local + tempo)
- **SC[`property.<slug>.nearby`]** = `[{location, time}]`. UI: `ListEditor` (2 colunas).
- Resolve o issue do CODE_REVIEW "distâncias iguais para todos os imóveis".

### B4. Reviews — **TABELA nova** + módulo CRUD
```sql
CREATE TABLE "Review" (
  id text PRIMARY KEY, propertySlug text NOT NULL,
  name text, date text, text text, rating numeric DEFAULT 5,
  published boolean DEFAULT true, displayOrder int DEFAULT 0,
  createdAt timestamp DEFAULT now(), updatedAt timestamp DEFAULT now()
);
```
- Rotas admin: `GET/POST/PATCH/DELETE /api/admin/reviews`.
- Rota pública: `GET /api/content/reviews` (só `published=true`).
- UI: lista por coleção com nome, data, texto, nota (**a nota hoje é fixa "5.0"/"4.98"** — tornar editável), toggle publicado, ordem.
- Religar `CollectionDetail`/`PropertyDetail` para ler daqui em vez de `reviews.ts`.

### B5. Galeria de fotos por coleção
- **MEDIA(property)** — reusar `MediaAsset` com `ownerType='property'`, `ownerSlug=<slug>`.
- UI: mesmo componente de fotos do `UnitCard` (upload/reordenar/capa/alt/excluir), na aba Propriedades.
- Religar o **hero + galeria** de `CollectionDetail` para usar essas fotos.

### B6. Página do apartamento (`/property/:prop/:unit`)
- Fazer a **galeria** ler as fotos do admin (`MediaAsset` do unit) em vez do scrape do Airbnb (`airbnbListings.generated.json`). *(Resolve o item 5 do inventário.)*
- Descrição/specs: já editáveis no admin, mas esta página ainda lê estático → religar.

---

## ▸ FASE C — Corpo das páginas institucionais (só add chave + trocar texto)

### C1. Home — 6 blocos de destaque (texto de cada card)
Hoje só é editável **quais apês** aparecem (`home.featured`) — não o **texto** dos blocos.
- **SC[`home.blocks`]** = `[{slug, eyebrow, name, description, quote, ctaLabel}]`. UI: `ListEditor` amplo, ou um editor por bloco.
- Imagem de cada bloco: **IMG[`home.block.<slug>`]** (hoje puxa a 1ª foto do apê).

### C2. Design Services (corpo — hoje tudo hardcoded exceto o hero)
| Seção | Mecanismo | Chave |
|---|---|---|
| "Our Approach": eyebrow, título, 2 parágrafos | SC | `design.approach.{eyebrow,title,p1,p2}` |
| "Our Approach": 3 bullets | SC (lista) | `design.approach.bullets` = `string[]` |
| "Core Disciplines": título, subtítulo | SC | `design.disciplines.{title,subtitle}` |
| "Core Disciplines": 3 cards | SC (lista) | `design.disciplines.cards` = `[{title,description}]` |
| CTA final: título, parágrafo, botão + link | SC | `design.cta.{title,paragraph,ctaLabel,ctaHref}` |
| (imagem "approach") | IMG | já existe `design.approach` ✅ |

### C3. Management Services (corpo)
| Seção | Mecanismo | Chave |
|---|---|---|
| "Service Architecture": eyebrow, título | SC | `management.services.{eyebrow,title}` |
| 4 cards de serviço | SC (lista) | `management.services.cards` = `[{title,description}]` |
| "Transparent Reporting": título, parágrafo | SC | `management.reporting.{title,paragraph}` |
| "Transparent Reporting": 4 bullets | SC (lista) | `management.reporting.bullets` = `string[]` |
| "Partner Criteria": título, intro | SC | `management.partner.{title,intro}` |
| "Partner Criteria": 3 bullets | SC (lista) | `management.partner.bullets` = `string[]` |

### C4. About (corpo)
| Seção | Mecanismo | Chave |
|---|---|---|
| "The Philosophy": título | SC | `about.philosophy.title` |
| "The Philosophy": 3 parágrafos | SC (lista ou 3 campos) | `about.philosophy.paragraphs` = `string[]` |
| Citação + assinatura | SC | `about.quote.{text,signature}` |
| (imagem) | IMG | já existe `about.hero`; add `about.philosophy` se quiser 2ª imagem |

### C5. Properties (`/properties`)
- Título "Find Property": **SC[`properties.title`]**.

### C6. Novos slots de imagem desta fase (adicionar a `IMAGE_SLOTS`)
`home.block.<slug>` (×6) · `about.philosophy` (opcional) · imagens de card se necessário.

---

## ▸ FASE D — SEO, Mapa, Disponibilidade e Leads

### D1. SEO por página — ⚠️ **já existe estático; falta só tornar editável**
- **`react-helmet-async` já está instalado E em uso** em TODAS as páginas: cada página já tem
  `<title>`, `<meta description>`, `og:title/description/image`, `twitter:card` — **mas hardcoded**
  (ver `Home.tsx:79`, `About.tsx:10`, `DesignServices.tsx:11`, etc.). CollectionDetail/PropertyDetail
  já geram SEO dinâmico a partir dos dados.
- **O que falta:** trazer esses valores para o admin. **SC[`seo.<page>`]** = `{title, description, ogImage}`
  para cada rota (`home`, `properties`, `about`, `design`, `management`, `contact`) e por coleção
  `seo.property.<slug>`, com fallback ao texto que já está no Helmet hoje. Imagem OG via IMG slot.
- **Não precisa** instalar dependência nem criar a infra de meta tags — só ler do SiteContent.

### D2. Pins do mapa
- Origem: `src/data/locations.ts`. **TABELA** `MapLocation` **ou** SC[`map.locations`] = `[{name, propertySlug, area, areaId, postcode, lat, lng}]`.
- UI ideal: **editor visual** (arrastar o pin define lat/lng) — evita repetir o ajuste manual de coords no código.
- Gerenciar as **áreas/filtros** (City Centre, Deansgate, Ancoats…): SC[`map.areas`].

### D3. Painel de disponibilidade & sync de iCal
- Aba mostrando por unidade: `lastSyncedAt`, nº de datas bloqueadas, se tem iCal configurado.
- Botão **"Sincronizar agora"** (por unidade e global) → chama `POST /api/sync` (já existe, protegido por `SYNC_SECRET`).
- (Recomendado) sync agendado por cron — hoje é manual.

### D4. Caixa de Leads (**aba "Leads"**)
- Tabela `Enquiry` **já existe** (vazia). Hoje o formulário de Contato vai só pro Formspree fixo (`xkgjeqvb`) e **não salva**.
- **Persistir** cada envio: nova rota `POST /api/enquiries` (pública) que grava em `Enquiry`, capturando contexto (propriedade, datas, hóspedes) quando vier de uma página de imóvel.
- UI: inbox com status `novo/lido/arquivado`.
- (Opcional) notificação por e-mail ao receber.
- Tornar o **destino do formulário** configurável: SC[`contact.formEndpoint`] ou migrar de vez para `Enquiry`.

---

## ▸ RESUMO — todas as chaves `SiteContent` a criar (por fase)

**Fase B:** `property.<slug>.{name,area,eyebrow,headline,description,quote,specs,neighborhoodTitle,amenities,nearby}` (×6 coleções)
**Fase C:** `home.blocks` · `design.approach.*` · `design.disciplines.*` · `design.cta.*` · `management.services.*` · `management.reporting.*` · `management.partner.*` · `about.philosophy.*` · `about.quote.*` · `properties.title`
**Fase D:** `seo.<page>` · `seo.property.<slug>` · `map.locations` · `map.areas` · `contact.formEndpoint`

## ▸ RESUMO — novas tabelas / migrations

| Tabela | Fase | Status |
|---|---|---|
| `Review` | B4 | criar |
| `MapLocation` (opcional; alternativa: SC) | D2 | criar/opcional |
| `Enquiry` | D4 | **já existe** — falta rota + UI |
| `MediaAsset(ownerType='property')` | B5 | **tabela já existe** — falta UI + wiring |

## ▸ RESUMO — novos slots de imagem (`IMAGE_SLOTS`)

Hoje: `home.hero`, `design.hero`, `design.approach`, `management.hero`, `about.hero`.
A adicionar: `home.block.<slug>` (×6) · galerias de coleção (via MediaAsset, não slot) · `about.philosophy` (opcional) · imagens OG por página (SEO).

---

### Ordem de valor sugerida
1. **Fase 0** (fechar Fase A) — meia-hora, destrava o resto.
2. **Fase B** (propriedades + reviews) — onde mora a maior parte do texto que você quer controlar.
3. **Fase C** (corpo das páginas) — mecânico, repetitivo, baixo risco.
4. **Fase D** (SEO/mapa/leads) — operação e crescimento.
