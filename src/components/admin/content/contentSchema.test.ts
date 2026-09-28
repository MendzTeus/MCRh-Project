import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONTENT_SECTIONS, SITE_DEFAULTS, KEYS_EDITED_ELSEWHERE } from './contentSchema';
import { extractSiteDefaults, serialize } from '../../../../scripts/extract-site-defaults.mjs';

const schemaKeys = CONTENT_SECTIONS.flatMap((s) => s.groups.flatMap((g) => g.fields.map((f) => f.key)));

describe('site defaults', () => {
  it('generated file is up to date with the public pages (run `npm run content:defaults`)', () => {
    const { defaults, conflicts, skipped } = extractSiteDefaults();
    const onDisk = readFileSync(new URL('../../../content/siteDefaults.generated.json', import.meta.url), 'utf8');
    expect(onDisk).toBe(serialize(defaults));
    expect(conflicts).toEqual([]);
    expect(skipped).toEqual([]);
  });
});

describe('admin content editor', () => {
  it('offers every text the public site renders', () => {
    const missing = Object.keys(SITE_DEFAULTS).filter((k) => !schemaKeys.includes(k) && !KEYS_EDITED_ELSEWHERE.has(k));
    expect(missing).toEqual([]);
  });

  it('only offers fields the public site actually uses', () => {
    expect(schemaKeys.filter((k) => !(k in SITE_DEFAULTS))).toEqual([]);
  });

  it('has no duplicate fields', () => {
    expect(schemaKeys.length).toBe(new Set(schemaKeys).size);
  });

  it('list fields match the default rows shape', () => {
    for (const field of CONTENT_SECTIONS.flatMap((s) => s.groups.flatMap((g) => g.fields))) {
      if (field.kind !== 'list') continue;
      const rows = SITE_DEFAULTS[field.key] as Record<string, unknown>[];
      expect(Array.isArray(rows), field.key).toBe(true);
      for (const row of rows) {
        expect(Object.keys(row).sort(), field.key).toEqual(field.columns.map((c) => c.key).sort());
      }
    }
  });
});
