export type AdminNavId =
  | 'dashboard'
  | 'leads'
  | 'apartments'
  | 'photos'
  | 'properties'
  | 'content'
  | 'images'
  | 'reviews'
  | 'availability'
  | 'collector';

export type AdminNavItem = {
  id: AdminNavId;
  label: string;
  path: string;
  /** Sidebar heading the item is listed under. */
  group: string;
};

// One route per section. Order and groups are what the sidebar shows.
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { id: 'dashboard', label: 'Painel', path: '/admin/dashboard', group: 'Operação' },
  { id: 'leads', label: 'Leads', path: '/admin/leads', group: 'Operação' },
  { id: 'availability', label: 'Disponibilidade', path: '/admin/availability', group: 'Operação' },
  { id: 'apartments', label: 'Apartamentos', path: '/admin/apartments', group: 'Imóveis' },
  { id: 'photos', label: 'Fotos dos apartamentos', path: '/admin/photos', group: 'Imóveis' },
  { id: 'properties', label: 'Prédios e coleções', path: '/admin/properties', group: 'Imóveis' },
  { id: 'reviews', label: 'Avaliações', path: '/admin/reviews', group: 'Imóveis' },
  { id: 'content', label: 'Textos do site', path: '/admin/content', group: 'Site' },
  { id: 'images', label: 'Imagens das páginas', path: '/admin/images', group: 'Site' },
  { id: 'collector', label: 'Coletor de avaliações', path: '/admin/collector', group: 'Ferramentas' },
];

// Old single-page admin links (/admin?tab=…) — kept working as redirects.
const LEGACY_TAB_PATHS: Readonly<Record<string, string>> = {
  painel: '/admin/dashboard',
  fotos: '/admin/photos',
  imagens: '/admin/images',
  conteudo: '/admin/content',
  propriedades: '/admin/properties',
  disponibilidade: '/admin/availability',
  coletor: '/admin/collector',
};

/** New path for an old `?tab=` value, or the dashboard for anything else. */
export function getLegacyAdminPath(tab: string | null): string {
  return (tab && LEGACY_TAB_PATHS[tab]) || '/admin/dashboard';
}

export function getAdminNavPath(id: AdminNavId): string {
  const item = ADMIN_NAV_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown admin navigation id: ${id}`);
  return item.path;
}
