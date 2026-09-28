import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ADMIN_NAV_ITEMS, getLegacyAdminPath } from './adminNavigation';

const appSource = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8');

describe('admin navigation', () => {
  it('every menu item has its own route (no more ?tab= screens)', () => {
    for (const item of ADMIN_NAV_ITEMS) {
      expect(item.path, item.id).not.toContain('?');
      expect(appSource, item.path).toContain(`path="${item.path}"`);
    }
  });

  it('old /admin?tab= links redirect to the new pages', () => {
    expect(getLegacyAdminPath('conteudo')).toBe('/admin/content');
    expect(getLegacyAdminPath('fotos')).toBe('/admin/photos');
    expect(getLegacyAdminPath('imagens')).toBe('/admin/images');
    expect(getLegacyAdminPath('propriedades')).toBe('/admin/properties');
    expect(getLegacyAdminPath('disponibilidade')).toBe('/admin/availability');
    expect(getLegacyAdminPath('coletor')).toBe('/admin/collector');
    expect(getLegacyAdminPath('painel')).toBe('/admin/dashboard');
    expect(getLegacyAdminPath(null)).toBe('/admin/dashboard');
    expect(getLegacyAdminPath('qualquer')).toBe('/admin/dashboard');
  });

  it('menu ids are unique', () => {
    const ids = ADMIN_NAV_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
