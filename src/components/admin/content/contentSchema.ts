import siteDefaults from '../../../content/siteDefaults.generated.json';

// Built-in text the public site shows for each key when nothing is saved in
// the admin (extracted from the public pages — see scripts/extract-site-defaults.mjs).
export const SITE_DEFAULTS: Record<string, unknown> = siteDefaults;

export type ListColumn = { key: string; label: string; wide?: boolean };

export type ContentFieldDef =
  | { kind: 'text'; key: string; label: string; hint?: string }
  | { kind: 'textarea'; key: string; label: string; hint?: string }
  | { kind: 'list'; key: string; label: string; columns: ListColumn[]; hint?: string };

export type ContentGroupDef = { title: string; hint?: string; fields: ContentFieldDef[] };
export type ContentSectionDef = { id: string; title: string; subtitle: string; path?: string; groups: ContentGroupDef[] };

const text = (key: string, label: string, hint?: string): ContentFieldDef => ({ kind: 'text', key, label, hint });
const area = (key: string, label: string, hint?: string): ContentFieldDef => ({ kind: 'textarea', key, label, hint });
const list = (key: string, label: string, columns: ListColumn[], hint?: string): ContentFieldDef => ({ kind: 'list', key, label, columns, hint });

const HOME_BLOCKS: { slug: string; label: string }[] = [
  { slug: 'chambers', label: 'Chambers' },
  { slug: 'john-dalton-st', label: 'John Dalton St' },
  { slug: 'wood-street', label: 'Wood Street' },
  { slug: 'ancoats', label: 'Ancoats' },
  { slug: 'old-trafford', label: 'Old Trafford' },
  { slug: 'the-collective', label: 'The Collective' },
];

// Only fields the site actually renders are offered (e.g. not every block has a quote).
function homeBlockGroup({ slug, label }: { slug: string; label: string }): ContentGroupDef {
  const candidates: ContentFieldDef[] = [
    text(`home.block.${slug}.eyebrow`, 'Sobretítulo'),
    text(`home.block.${slug}.name`, 'Nome'),
    area(`home.block.${slug}.description`, 'Descrição'),
    text(`home.block.${slug}.cta`, 'Texto do botão'),
    text(`home.block.${slug}.quote`, 'Citação'),
  ];
  return {
    title: `Bloco ${label}`,
    hint: slug === 'chambers'
      ? 'Com apartamentos em destaque definidos (em Apartamentos), este bloco dá lugar a eles: só o sobretítulo e o botão continuam aparecendo.'
      : undefined,
    fields: candidates.filter((field) => field.key in SITE_DEFAULTS),
  };
}

function seoGroup(page: string, label: string): ContentGroupDef {
  const candidates: ContentFieldDef[] = [
    text(`seo.${page}.title`, 'Título da aba (title)'),
    area(`seo.${page}.description`, 'Descrição no Google (meta description)'),
    text(`seo.${page}.ogTitle`, 'Título ao compartilhar (og:title)'),
    area(`seo.${page}.ogDescription`, 'Descrição ao compartilhar (og:description)'),
  ];
  return { title: label, fields: candidates.filter((field) => field.key in SITE_DEFAULTS) };
}

export const CONTENT_SECTIONS: ContentSectionDef[] = [
  {
    id: 'home', title: 'Home', subtitle: 'Página inicial', path: '/',
    groups: [
      { title: 'Capa (hero)', fields: [
        text('home.hero.title', 'Título'),
        area('home.hero.subtitle', 'Subtítulo'),
        text('home.hero.ctaLabel', 'Texto do botão'),
        text('home.hero.ctaHref', 'Link do botão', 'Ex.: /properties'),
      ] },
      ...HOME_BLOCKS.map(homeBlockGroup),
      { title: 'Mapa, números e depoimentos', fields: [
        text('home.map.title', 'Título da seção do mapa'),
        list('home.stats', 'Números', [{ key: 'value', label: 'Número (ex.: 40+)' }, { key: 'label', label: 'Rótulo', wide: true }]),
        text('home.testimonials.eyebrow', 'Sobretítulo dos depoimentos'),
        text('home.testimonials.title', 'Título dos depoimentos'),
      ] },
    ],
  },
  {
    id: 'properties', title: 'Properties', subtitle: 'Lista de apartamentos', path: '/properties',
    groups: [{ title: 'Cabeçalho', fields: [text('properties.title', 'Título')] }],
  },
  {
    id: 'design', title: 'Design Services', subtitle: 'Página de design', path: '/design-services',
    groups: [
      { title: 'Capa (hero)', fields: [
        text('design.hero.eyebrow', 'Sobretítulo'),
        text('design.hero.title', 'Título'),
        area('design.hero.paragraph', 'Parágrafo'),
      ] },
      { title: 'Our Approach', fields: [
        text('design.approach.eyebrow', 'Sobretítulo'),
        text('design.approach.title', 'Título'),
        area('design.approach.p1', 'Parágrafo 1'),
        area('design.approach.p2', 'Parágrafo 2'),
        list('design.approach.bullets', 'Tópicos', [{ key: 'item', label: 'Tópico', wide: true }]),
      ] },
      { title: 'Our Design Services', fields: [
        text('design.comparison.eyebrow', 'Sobretítulo'),
        area('design.comparison.paragraph', 'Parágrafo'),
      ] },
      { title: 'Chamada final', fields: [
        text('design.cta.title', 'Título'),
        area('design.cta.paragraph', 'Parágrafo'),
        text('design.cta.ctaLabel', 'Texto do botão'),
        text('design.cta.ctaHref', 'Link do botão'),
      ] },
    ],
  },
  {
    id: 'management', title: 'Management Services', subtitle: 'Página de gestão', path: '/management-services',
    groups: [
      { title: 'Capa (hero)', fields: [
        text('management.hero.eyebrow', 'Sobretítulo'),
        text('management.hero.title', 'Título'),
        area('management.hero.paragraph', 'Parágrafo'),
      ] },
      { title: 'Serviços', fields: [
        text('management.services.eyebrow', 'Sobretítulo'),
        text('management.services.title', 'Título'),
        list('management.services.cards', 'Cards de serviço', [{ key: 'title', label: 'Título' }, { key: 'desc', label: 'Descrição', wide: true }]),
      ] },
    ],
  },
  {
    id: 'about', title: 'About', subtitle: 'Página sobre', path: '/about',
    groups: [
      { title: 'Capa (hero)', fields: [
        text('about.hero.eyebrow', 'Sobretítulo'),
        text('about.hero.title', 'Título'),
      ] },
      { title: 'Who We Are', fields: [
        text('about.philosophy.title', 'Título'),
        area('about.philosophy.p1', 'Parágrafo 1 (destaque)'),
        area('about.philosophy.p2', 'Parágrafo 2'),
        area('about.philosophy.p3', 'Parágrafo 3'),
      ] },
      { title: 'Short-stay apartments', fields: [
        text('about.stays.title', 'Título'),
        area('about.stays.p1', 'Parágrafo 1'),
        area('about.stays.p2', 'Parágrafo 2'),
        area('about.stays.p3', 'Parágrafo 3'),
      ] },
      { title: 'Property management', fields: [
        text('about.management.title', 'Título'),
        area('about.management.intro', 'Introdução'),
        list('about.management.services', 'Serviços', [{ key: 'item', label: 'Serviço', wide: true }]),
        area('about.management.closing', 'Parágrafo final'),
      ] },
    ],
  },
  {
    id: 'contact', title: 'Contato', subtitle: 'Página de contato e dados usados em todo o site', path: '/contact',
    groups: [{ title: 'Dados de contato', fields: [
      text('contact.email', 'E-mail', 'Também usado no botão "Enquire" dos apartamentos.'),
      text('contact.phone', 'Telefone'),
      text('contact.whatsapp', 'WhatsApp', 'Só números, com código do país (ex.: 447700900123). Vazio = opção WhatsApp escondida.'),
      area('contact.address', 'Endereço'),
      area('contact.intro', 'Texto de introdução'),
    ] }],
  },
  {
    id: 'layout', title: 'Menu e rodapé', subtitle: 'Aparecem em todas as páginas',
    groups: [
      { title: 'Menu', fields: [
        text('brand.name', 'Nome da marca (logo)'),
        list('nav.links', 'Links do menu', [{ key: 'label', label: 'Texto' }, { key: 'to', label: 'Caminho (ex.: /about)', wide: true }]),
        text('nav.cta.label', 'Botão do menu — texto'),
        text('nav.cta.href', 'Botão do menu — link'),
      ] },
      { title: 'Rodapé', fields: [
        list('footer.links', 'Links do rodapé', [{ key: 'label', label: 'Texto' }, { key: 'href', label: 'Link', wide: true }]),
        list('footer.social', 'Redes sociais', [{ key: 'label', label: 'Rede (ex.: Instagram)' }, { key: 'href', label: 'Link', wide: true }]),
        text('footer.copyright', 'Copyright', 'O ano é adicionado automaticamente.'),
      ] },
    ],
  },
  {
    id: 'seo', title: 'SEO', subtitle: 'Como as páginas aparecem no Google e ao compartilhar',
    groups: [
      seoGroup('home', 'Home'),
      seoGroup('properties', 'Properties'),
      seoGroup('design', 'Design Services'),
      seoGroup('management', 'Management Services'),
      seoGroup('about', 'About'),
      seoGroup('contact', 'Contato'),
    ],
  },
];

// Keys edited elsewhere in the admin, not in the content editor.
export const KEYS_EDITED_ELSEWHERE = new Set(['home.featured']);
