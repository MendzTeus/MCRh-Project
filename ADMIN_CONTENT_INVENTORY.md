# Inventário completo de conteúdo editável — MCRh

> Levantamento **página por página** de tudo que pode/deve ser editável pelo `/admin`.
> Objetivo: fechar o "tá incompleto". Legenda:
> **✅ já no admin** · **🟡 no banco mas sem UI ainda** · **❌ estático (hardcoded), falta tudo**

O admin atual cobre **só os apartamentos** (nome, specs, link, visível, fotos). Tudo
marcado ❌/🟡 abaixo ainda NÃO dá pra editar. É isso que falta construir.

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
| Logo "MCRh" (texto) | Navbar + Footer | ❌ |
| Links do menu (Properties, Design, Management, About, Contact) | Navbar | ❌ |
| Links do rodapé: **Privacy, Terms, Sustainability, Careers** (hoje todos apontam p/ `#`) | Footer | ❌ |
| Texto de copyright | Footer | ❌ (só o ano é dinâmico) |
| Redes sociais (Instagram, etc.) | — | ❌ (nem existem ainda) |

## 2. 🏠 Home (`/`)

| Item | Detalhe | Status |
|---|---|---|
| **Foto de capa (hero)** | hoje = 1ª foto do "chambers" | ❌ (o que você citou) |
| Título do hero | "Experts In Short-Term Lettings" | ❌ |
| Subtítulo do hero | "The first choice for property rentals…" | ❌ |
| Botão do hero | "EXPLORE PROPERTIES" → `/properties` | ❌ |
| **6 blocos de destaque** (Chambers, John Dalton, Wood St, Ancoats, Trafford, The Collective) | cada um: **imagem**, eyebrow, nome, descrição, citação, texto do botão | ❌ |
| Título da seção do mapa | "Discover Our Locations" | ❌ |
| Pins do mapa (nome, área, postcode, coordenadas) | `locations.ts` | 🟡 |
| **Números/stats** | "30+ Properties", "500+ Guest Reviews", "100% 5-Star", "7 Neighbourhoods" | ❌ |
| Seção "Guest Experiences" | título + **3 depoimentos** (texto, nome, propriedade) — fixos, separados dos reviews reais | ❌ |
| SEO | title, description, og:title, og:description, **og:image**, twitter:card | ❌ |

## 3. 🔎 Properties (`/properties`)

| Item | Status |
|---|---|
| Lista de apartamentos (nome, specs, link, foto, ocultar) | ✅ |
| Título "Find Property" | ❌ |
| SEO (title, description) | ❌ |

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
| SEO por propriedade | ❌ |

## 5. 🛏️ Página do apartamento (`/property/:prop/:unit`)

| Item | Status |
|---|---|
| Galeria do apê (hoje vem do scrape do Airbnb) | ❌ (as fotos do admin ainda não substituem aqui) |
| Nome, specs, descrição | 🟡 (editável no admin, mas esta página ainda lê estático) |
| Amenidades / reviews / mapa / distâncias | ❌ |

## 6. 🎨 Design Services (`/design-services`) — **tudo hardcoded**

| Item | Status |
|---|---|
| **Imagem do hero** (chambers idx3) | ❌ (o que você citou) |
| Eyebrow "MCRh Studio", título, parágrafo do hero | ❌ |
| Seção "Our Approach": eyebrow, título, 2 parágrafos, **3 bullets**, **imagem** (ancoats idx1) | ❌ |
| Seção "Core Disciplines": título, subtítulo, **3 cards** (título + descrição) | ❌ |
| CTA final: título, parágrafo, **botão + link** | ❌ |
| SEO | ❌ |

## 7. 🛎️ Management Services (`/management-services`) — **tudo hardcoded**

| Item | Status |
|---|---|
| **Imagem do hero** (chambers idx4) | ❌ |
| Eyebrow, título, parágrafo do hero | ❌ |
| "Service Architecture": eyebrow, título, **4 cards de serviço** (título + descrição) | ❌ |
| "Transparent Reporting": título, parágrafo, **4 bullets** | ❌ |
| Card "Partner Criteria": título, intro, **3 bullets** | ❌ |
| SEO | ❌ |

## 8. ℹ️ About (`/about`) — **tudo hardcoded**

| Item | Status |
|---|---|
| Eyebrow "Our Story", título grande | ❌ |
| **Imagem** (john-dalton-st idx2) | ❌ |
| "The Philosophy": título + **3 parágrafos** | ❌ |
| Bloco de citação + assinatura ("The Founders") | ❌ |
| SEO | ❌ |

## 9. ✉️ Contact (`/contact`)

| Item | Detalhe | Status |
|---|---|---|
| Título + parágrafo de intro | | ❌ |
| **E-mail** | contact@mcrh.co.uk | ❌ |
| **Endereço** | Chambers Building / Deansgate / Manchester M3 3EW / UK | ❌ |
| Telefone / WhatsApp | (não existe ainda) | ❌ |
| Destino do formulário | Formspree fixo (`xkgjeqvb`) — leads **não são salvos** | ❌ |
| Caixa de leads (ver os contatos recebidos) | tabela `Enquiry` já existe, vazia | 🟡 |

---

## Resumo: o que construir para ficar completo

O admin precisa de **3 grandes áreas** (hoje só a 1ª existe, parcialmente):

1. **Apartamentos** ✅ (feito) — nome, specs, link, ocultar, fotos.
   - Falta: refletir também na página de detalhe individual (item 5).
2. **🖼️ Imagens do site** ❌ — gerenciador de "slots" para trocar qualquer foto de
   capa/hero/seção (Home, About, Design, Management) e galerias de propriedade, com upload
   próprio (não depender do Airbnb). *Resolve os 3 exemplos que você deu.*
3. **📝 Conteúdo & textos** ❌ — editar textos, números (stats), depoimentos, reviews,
   amenidades, distâncias, e-mail/endereço/telefone, links do rodapé e redes sociais, SEO.

Mais dois módulos operacionais:
4. **Propriedades/coleções** (o nível acima do apartamento) — nome, descrição, amenidades,
   distâncias, reviews. (Itens 4.)
5. **Leads** — inbox dos contatos recebidos (item 9).

---

## Nota sobre o estilo do painel
O `/admin` atual está com visual "cru" (inputs simples). Refazer para o visual do site
— paleta creme/grafite, tipografia display, cards mais refinados — junto de organizar em
**abas por área** (Apartamentos · Imagens · Conteúdo · Propriedades · Leads).
