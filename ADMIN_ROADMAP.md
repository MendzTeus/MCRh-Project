# Roadmap — Painel de Administração (`/admin`) do MCRh

> Documento de planejamento. Nenhum código de admin foi escrito ainda — este arquivo
> descreve **o que precisa existir** para você conseguir editar tudo do site (fotos,
> textos, links, números, preços/reviews, disponibilidade) com salvamento automático
> no Supabase.

---

## 1. Situação atual (o que a análise do site revelou)

O site é um SPA React (Vite) servido pelo nginx, com uma API Node/Express (`server/`)
já conectada ao Supabase apenas para **disponibilidade** (iCal sync).

**O problema central:** hoje **quase todo o conteúdo é estático**, escrito à mão em
arquivos TypeScript e dentro das páginas. Para mudar qualquer coisa é preciso editar
código e refazer o deploy. Mapa do que existe:

| Conteúdo | Onde vive hoje | Já no Supabase? |
|---|---|---|
| Propriedades (nome, área, headline, descrição, quote, nº de quartos/camas/banheiros, amenities, "distâncias", título de bairro) | `src/data/properties.ts` (860 linhas) | ❌ Estático |
| Unidades / inventário (unitName, specs, postcode, **link do Airbnb**) | `src/data/airbnbInventory.ts` | ⚠️ Parcial (`Unit` tem slug + iCal) |
| Fotos das propriedades e unidades | `src/data/properties.ts` (`/media/...`) + `airbnbListings.generated.json` (scrape do Airbnb, 166 KB) | ❌ Estático / CDN do Airbnb |
| Reviews de hóspedes | `src/data/reviews.ts` | ❌ Estático |
| Pins do mapa (coordenadas, área, postcode) | `src/data/locations.ts` | ❌ Estático |
| Números da Home ("30+ Properties", "500+ Reviews", "100%", "7") | hardcoded em `src/pages/Home.tsx` | ❌ Estático |
| Textos de hero / CTA / páginas (About, Design, Management) | hardcoded nas páginas | ❌ Estático |
| Contato (e-mail `contact@mcrh.co.uk`, endereço, endpoint do Formspree) | hardcoded em `src/pages/Contact.tsx` | ❌ Estático |
| Links do rodapé (Privacy, Terms, etc. — hoje apontam para `#`) | hardcoded em `src/components/Footer.tsx` | ❌ Estático |
| Disponibilidade (datas bloqueadas, URLs de iCal, status de sync) | `BlockedDate` + `Unit` no Supabase | ✅ Sim |
| Leads do formulário de contato | vão só para o Formspree (não são salvos) | ❌ Não persistido |

**Conclusão de arquitetura:** o trabalho do admin tem duas metades:
1. **Migrar conteúdo estático → Supabase** e fazer o frontend **ler em runtime** (via API), para que uma edição apareça no site na hora, sem novo deploy.
2. **Construir a UI de administração** (`/admin`) com CRUD + upload de imagens + autosave.

---

## 2. Decisão de arquitetura (recomendada)

```
┌─────────────┐     edita      ┌──────────────┐   grava    ┌────────────┐
│  /admin     │ ─────────────► │  API Express │ ─────────► │  Supabase  │
│ (React, no  │ ◄───────────── │  (server/)   │ ◄───────── │  (Postgres │
│  mesmo app) │    lê/valida   │  + Auth JWT  │            │  + Storage)│
└─────────────┘                └──────────────┘            └────────────┘
        ▲                              ▲
        │ lê conteúdo em runtime       │
┌─────────────┐                        │
│ Site público│ ───────────────────────┘
│ (React)     │   GET /api/content/*   (com cache)
└─────────────┘
```

**Princípios:**
- **A `service_key` do Supabase nunca vai para o browser.** Toda escrita passa pela API
  Express, que valida um JWT de admin. (Hoje `SUPABASE_SERVICE_KEY` já é server-side — manter assim.)
- **Autenticação via Supabase Auth** (e-mail/senha ou magic link). O browser usa a `anon key`
  só para logar; a API verifica o token em cada rota `/api/admin/*`.
- **Imagens no Supabase Storage** (bucket público `property-media`), não mais dependendo do
  scrape do Airbnb. A CDN do Airbnb pode sumir/mudar a qualquer momento.
- **Autosave:** cada campo salva no `blur`/debounce via `PATCH` na API; estado de
  "salvando / salvo / erro" visível na UI.
- **Publicado vs. rascunho** (opcional, fase posterior): um flag `published` para você
  editar sem afetar o site até confirmar.

---

## 3. Schema Supabase proposto (novas tabelas)

Já existem `Property`, `Unit`, `BlockedDate`. Precisamos expandir/estabilizar:

```
Property        id, slug*, name, area, eyebrow, headline, description, quote,
                maxGuests, bedrooms, beds, bathrooms, neighborhoodTitle,
                displayOrder, published, heroImageId, seoTitle, seoDescription,
                createdAt, updatedAt
Unit            id, propertySlug*, unitSlug*, unitName, suppliedSpecs, postcode,
                airbnbUrl, icalAirbnbUrl, icalVrboUrl, description, squareFeet,
                displayOrder, lastSyncedAt        (estende a tabela atual)
PropertyGroup   define o agrupamento hoje hardcoded em getInventoryForProperty()
                (ex.: "chambers" = [chambers-9, chambers-11]; "ancoats" = [...])
MediaAsset      id, ownerType('property'|'unit'), ownerId, url (Storage), alt,
                isPrimary, displayOrder, width, height
Amenity         id, propertyId, label, displayOrder
NearbyPlace     id, propertyId, location, time, displayOrder   (as "distâncias")
Review          id, propertySlug, name, date, text, rating, displayOrder, published
MapLocation     id, name, propertySlug, collectionSlug, area, areaId, postcode,
                lat, lng, displayOrder
Area            id('city-centre'...), label, displayOrder      (filtros do mapa)
SiteContent     key*, value(jsonb)   — bloco chave/valor para conteúdo global:
                home.hero.title, home.stats[], contact.email, contact.address,
                footer.links[], social[], seo defaults, etc.
Enquiry         id, name, email, message, propertySlug?, checkIn?, checkOut?,
                guests?, createdAt, status('new'|'read'|'archived')
AdminUser       (gerenciado pelo Supabase Auth) + tabela de perfil/role
AuditLog        id, adminId, action, table, recordId, diff(jsonb), createdAt
```
`*` = chave única/estável. Migração inicial: um script que lê os `src/data/*.ts`
atuais e faz o *seed* dessas tabelas (feito uma vez).

---

## 4. Módulos da UI de admin (funcionalidades)

### 4.1. 🔐 Autenticação & Shell
- Tela de login (Supabase Auth — magic link ou e-mail/senha).
- Layout com sidebar, indicador global de "salvando/salvo", logout.
- Middleware na API: toda rota `/api/admin/*` exige JWT válido.

### 4.2. 🏠 Propriedades (o núcleo)
CRUD completo de cada propriedade + reordenar (`displayOrder`, drag-and-drop):
- Campos de texto: `name`, `area`, `eyebrow`, `headline`, `description`, `quote`, `neighborhoodTitle`.
- Números: `maxGuests`, `bedrooms`, `beds`, `bathrooms`.
- **Amenities**: lista editável (add/remover/reordenar).
- **Nearby places / distâncias**: pares `location` + `time` editáveis.
- SEO por propriedade: `seoTitle`, `seoDescription`, imagem OG.
- Toggle `published`.

### 4.3. 🚪 Unidades / Inventário
Gerenciar as unidades dentro de cada propriedade:
- `unitName`, `suppliedSpecs` (ex.: "2BED 2BATH"), `postcode`, `description`, `squareFeet`.
- **Link do Airbnb** (`airbnbUrl`) — editável, com validação de URL.
- **URLs de iCal** (`icalAirbnbUrl`, `icalVrboUrl`) que alimentam o sync de disponibilidade.
- Gerenciar o **agrupamento** (PropertyGroup) que hoje está hardcoded — ex.: "chambers"
  reúne "chambers-9" e "chambers-11".
- Reordenar unidades.

### 4.4. 📸 Gerenciador de Mídia (a parte que você mais pediu)
- **Upload** de fotos (drag-and-drop) → Supabase Storage, com preview.
- Galeria por **propriedade** e por **unidade**.
- Definir **foto principal** (hero), **reordenar** por arrastar, **remover**.
- Editar **texto alternativo (alt)** de cada imagem (acessibilidade + SEO).
- (Recomendado) geração de thumbnails / compressão no upload.
- Substitui a dependência do `airbnbListings.generated.json` (scrape) por mídia própria.

### 4.5. ⭐ Reviews
- CRUD de reviews por propriedade: `name`, `date`, `text`, `rating`, `published`, ordem.
- Hoje a nota é fixa "5.0" — permitir configurar por review/propriedade.

### 4.6. 🗺️ Localizações do Mapa
- Editar pins: `name`, `postcode`, `area`/`areaId`, `lat`/`lng`.
- Ideal: **seletor visual no mapa** (arrastar o pin define lat/lng) — os postcodes/coords
  já foram corrigidos manualmente antes; um editor evita repetir isso no código.
- Gerenciar as **áreas** (filtros: City Centre, Deansgate, Ancoats, etc.).

### 4.7. 🎛️ Conteúdo da Home & Global (`SiteContent`)
- **Números da Home**: "30+ Properties", "500+ Guest Reviews", "100% 5-Star", "7 Neighbourhoods" — hoje hardcoded.
- **Hero**: título, subtítulo, texto do CTA.
- **Propriedades em destaque** e ordem na Home.
- Textos das páginas About / Design Services / Management Services.

### 4.8. 📇 Configurações de Contato & Rodapé
- E-mail de contato (`contact@mcrh.co.uk`), endereço do estúdio, telefone/WhatsApp.
- **Endpoint do formulário** (hoje Formspree fixo) — configurável, ou migrar para `Enquiry` (4.10).
- Links do rodapé (Privacy, Terms, Sustainability, Careers — hoje apontam para `#`).
- Links de redes sociais.

### 4.9. 📅 Disponibilidade & Sync de iCal
- Painel mostrando, por unidade: `lastSyncedAt`, nº de datas bloqueadas, se tem iCal configurado.
- Botão **"Sincronizar agora"** (por unidade e global) → chama `POST /api/sync` (já existe;
  agora protegido por `SYNC_SECRET` — o admin autenticado dispara via API).
- Visualização de calendário das datas bloqueadas.
- (Recomendado) sync automático agendado (cron) — hoje é manual.

### 4.10. 📥 Caixa de Leads (Enquiries)
- Hoje os envios do formulário vão só para o Formspree e **não são salvos**.
- Persistir cada envio na tabela `Enquiry` + inbox no admin (novo/lido/arquivado).
- Capturar contexto (propriedade, datas, hóspedes) quando vier de uma página de imóvel.
- (Opcional) notificação por e-mail ao receber.

### 4.11. 🧾 Auditoria (fase posterior)
- Log de quem mudou o quê e quando (`AuditLog`) — útil se mais de uma pessoa administrar.

---

## 5. Trabalho no site público (para as edições refletirem)

Para o admin ter efeito real, o frontend precisa parar de importar `src/data/*` em
build-time e passar a **buscar da API** (com cache/SWR):
- Novos endpoints de leitura: `GET /api/content/properties`, `/api/content/reviews`,
  `/api/content/locations`, `/api/content/site` (blocos globais), etc.
- Camada de cache no cliente (ex.: React Query/SWR) + cache HTTP curto no nginx.
- Fallback: manter os dados estáticos como *seed*/backup inicial.

> Alternativa mais simples (se não quiser runtime dinâmico): admin grava no Supabase e
> dispara um **rebuild/redeploy** automático. Atualização não é instantânea, mas a stack
> do site continua 100% estática. Recomendo a via runtime para edição instantânea.

---

## 6. Roadmap faseado (sugestão de execução)

**Fase 0 — Fundação** *(pré-requisito de tudo)*
- [ ] Definir e criar o schema Supabase (seção 3) + RLS.
- [ ] Script de seed: `src/data/*.ts` → tabelas.
- [ ] Supabase Auth + criar seu usuário admin.
- [ ] Middleware de auth nas rotas `/api/admin/*`.
- [ ] Endpoints de leitura `/api/content/*` e fazer 1 página (ex.: Properties) ler da API.

**Fase 1 — MVP do admin** *(o que você pediu primeiro: fotos e dados dos imóveis)*
- [ ] Shell do admin + login.
- [ ] Módulo Propriedades (4.2) com autosave.
- [ ] Módulo Unidades (4.3) incl. link do Airbnb + iCal.
- [ ] **Gerenciador de Mídia (4.4)** com upload/reordenar/alt.
- [ ] Módulo Reviews (4.5).

**Fase 2 — Conteúdo global**
- [ ] Números/hero da Home + destaques (4.7).
- [ ] Contato & rodapé & social (4.8).
- [ ] Localizações do mapa com editor visual (4.6).
- [ ] SEO por página.

**Fase 3 — Operação**
- [ ] Painel de disponibilidade + sync manual/agendado (4.9).
- [ ] Caixa de leads (4.10).
- [ ] Rascunho/publicação + AuditLog (4.11).

---

## 7. Notas técnicas / reaproveitamento

- **Reusar a API `server/` existente** (Express) — adicionar um router `admin.js` e um
  `content.js`. Já corrigimos `server/package.json` (CommonJS) e a auth do sync.
- **Storage:** criar bucket `property-media` (público para leitura, escrita via service key).
- **Segurança:** habilitar **RLS** nas tabelas; leitura pública só do que é público;
  escrita só via service key (API). `SYNC_SECRET`/JWT já no fluxo.
- **Validação:** schema com Zod na API (URLs, números, campos obrigatórios) para o autosave
  não gravar lixo.
- **Sem novo framework:** o `/admin` pode ser uma rota protegida no mesmo app React, então
  não há segundo deploy. Alternativa: subprojeto separado se preferir isolar.

---

### TL;DR
Você não precisa só de uma "página de admin" — precisa **migrar o conteúdo estático para o
Supabase** e então um painel com ~11 módulos. O primeiro entregável de valor (Fase 1) é:
**Propriedades + Unidades + Gerenciador de Fotos + Reviews**, com autosave no Supabase.
