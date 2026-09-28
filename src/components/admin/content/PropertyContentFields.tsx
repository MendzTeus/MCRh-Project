import { useState } from 'react';
import { getPropertyBySlug } from '../../../data/properties';
import { propertyContentKeys, type PropertySpecsOverride } from '../../../lib/propertyContent';
import { ContentListField, ContentTextField, SaveStatus, inputClass, type SaveContent, type SaveState } from './ContentFields';

const SPEC_FIELDS: { key: keyof PropertySpecsOverride; label: string }[] = [
  { key: 'maxGuests', label: 'Hóspedes (máx.)' },
  { key: 'bedrooms', label: 'Quartos' },
  { key: 'beds', label: 'Camas' },
  { key: 'bathrooms', label: 'Banheiros' },
];

// Blank or 0 = "use the site's number"; only positive whole numbers are stored.
function SpecsEditor({ storageKey, saved, defaults, onSave }: {
  storageKey: string;
  saved: unknown;
  defaults: Required<PropertySpecsOverride>;
  onSave: SaveContent;
}) {
  const initial = (saved && typeof saved === 'object' ? saved : {}) as PropertySpecsOverride;
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(SPEC_FIELDS.map(({ key }) => [key, (initial[key] ?? 0) > 0 ? String(initial[key]) : ''])));
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const custom = SPEC_FIELDS.some(({ key }) => (initial[key] ?? 0) > 0);

  const commit = (next: Record<string, string>) => {
    const value: PropertySpecsOverride = {};
    for (const { key } of SPEC_FIELDS) {
      const n = Number(next[key]);
      if (Number.isInteger(n) && n > 0) value[key] = n;
    }
    if (JSON.stringify(value) === JSON.stringify(Object.fromEntries(SPEC_FIELDS.filter(({ key }) => (initial[key] ?? 0) > 0).map(({ key }) => [key, initial[key]])))) return;
    setState({ kind: 'saving' });
    onSave(storageKey, Object.keys(value).length ? value : undefined)
      .then(() => setState({ kind: 'saved' }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="font-body text-[11px] font-semibold text-on-surface">Specs do prédio</label>
        <span className="font-body text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded"
          style={custom ? { background: '#C5A05922', color: '#826927' } : { background: 'rgba(16,28,45,0.06)', color: 'rgba(16,28,45,0.55)' }}>
          {custom ? 'Personalizado' : 'Padrão do site'}
        </span>
        <span className="ml-auto"><SaveStatus state={state} /></span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {SPEC_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <p className="font-body text-[10px] text-on-surface-variant mb-1">{label}</p>
            <input type="number" min={1} value={draft[key]} placeholder={String(defaults[key])}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              onBlur={() => commit(draft)} className={inputClass} />
          </div>
        ))}
      </div>
      <p className="font-body text-[11px] text-on-surface-variant/60 mt-1">
        Usados quando o apartamento não tem os números do Airbnb, e o número de hóspedes limita a busca da coleção. Vazio = número atual (em cinza).
      </p>
    </div>
  );
}

/**
 * Collection/building content that lives in SiteContent (`property.<slug>.*`)
 * and overrides the built-in data from properties.ts on the public pages.
 */
export function PropertyContentFields({ slug, content, onSave }: { slug: string; content: Record<string, unknown>; onSave: SaveContent }) {
  const builtIn = getPropertyBySlug(slug);
  if (!builtIn) return null;
  const keys = propertyContentKeys(slug);

  return (
    <div className="grid gap-5">
      <ContentTextField def={{ kind: 'textarea', key: keys.headline, label: 'Headline', hint: 'Frase abaixo do nome, no topo da página da coleção.' }}
        saved={content[keys.headline]} onSave={onSave} fallback={builtIn.headline} />
      <ContentListField def={{ kind: 'list', key: keys.amenities, label: 'Amenidades', columns: [{ key: 'item', label: 'Amenidade', wide: true }], hint: 'Mostradas na página de cada apartamento deste prédio.' }}
        saved={content[keys.amenities]} onSave={onSave} fallback={builtIn.amenities.map((item) => ({ item }))} />
      <ContentListField def={{ kind: 'list', key: keys.nearby, label: 'Distâncias', columns: [{ key: 'location', label: 'Local', wide: true }, { key: 'time', label: 'Tempo (ex.: 5 min walk)' }], hint: 'Seção "The Neighborhood" da coleção e dos apartamentos (os 3 primeiros).' }}
        saved={content[keys.nearby]} onSave={onSave} fallback={builtIn.distances.map((d) => ({ location: d.location, time: d.time }))} />
      <SpecsEditor storageKey={keys.specs} saved={content[keys.specs]} onSave={onSave}
        defaults={{ maxGuests: builtIn.maxGuests, bedrooms: builtIn.bedrooms, beds: builtIn.beds, bathrooms: builtIn.bathrooms }} />
    </div>
  );
}
