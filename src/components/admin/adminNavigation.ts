export type AdminNavId =
  | 'dashboard'
  | 'apartments'
  | 'photos'
  | 'images'
  | 'content'
  | 'properties'
  | 'reviews'
  | 'availability'
  | 'leads'
  | 'collector';

export type AdminNavItem = {
  id: AdminNavId;
  label: string;
  path: string;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin?tab=painel' },
  { id: 'apartments', label: 'Apartments', path: '/admin/apartments' },
  { id: 'photos', label: 'Photos', path: '/admin?tab=fotos' },
  { id: 'images', label: 'Images', path: '/admin?tab=imagens' },
  { id: 'content', label: 'Content', path: '/admin?tab=conteudo' },
  { id: 'properties', label: 'Properties', path: '/admin?tab=propriedades' },
  { id: 'reviews', label: 'Reviews', path: '/admin/reviews' },
  { id: 'availability', label: 'Availability', path: '/admin?tab=disponibilidade' },
  { id: 'leads', label: 'Leads', path: '/admin/leads' },
  { id: 'collector', label: 'Collector', path: '/admin?tab=coletor' },
];

export type LegacyAdminTab =
  | 'dashboard'
  | 'photos'
  | 'images'
  | 'content'
  | 'properties'
  | 'availability'
  | 'collector';

const LEGACY_ADMIN_TAB_BY_QUERY: Readonly<Record<string, LegacyAdminTab>> = {
  painel: 'dashboard',
  fotos: 'photos',
  imagens: 'images',
  conteudo: 'content',
  propriedades: 'properties',
  disponibilidade: 'availability',
  coletor: 'collector',
};

export function getLegacyAdminTab(queryValue: string | null): LegacyAdminTab | null {
  return queryValue ? LEGACY_ADMIN_TAB_BY_QUERY[queryValue] ?? null : null;
}

export function getAdminNavPath(id: AdminNavId): string {
  const item = ADMIN_NAV_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Unknown admin navigation id: ${id}`);
  return item.path;
}
