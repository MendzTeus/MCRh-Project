import { useState } from 'react';
import { getPropertyBySlug } from '../../../data/properties';
import { readAmenities, readNearby } from '../../../lib/propertyContent';
import type { useApi } from '../../../hooks/useAdminApi';
import type { AdminProperty } from '../sections/shared';
import { ContentListField, ContentTextField, SaveStatus, inputClass, type SaveContent, type SaveState } from './ContentFields';

type Api = ReturnType<typeof useApi>;
type SpecKey = 'maxGuests' | 'bedrooms' | 'beds' | 'bathrooms';

const SPEC_FIELDS: { key: SpecKey; label: string }[] = [
  { key: 'maxGuests', label: 'Hóspedes (máx.)' },
  { key: 'bedrooms', label: 'Quartos' },
  { key: 'beds', label: 'Camas' },
  { key: 'bathrooms', label: 'Banheiros' },
];

// Blank = use the site's number (NULL column); only whole numbers 1–50 are stored.
function SpecsEditor({ property, defaults, patch }: {
  property: AdminProperty;
  defaults: Record<SpecKey, number>;
  patch: (fields: Record<string, unknown>) => Promise<void>;
}) {
  const saved = (key: SpecKey) => (typeof property[key] === 'number' && (property[key] as number) > 0 ? String(property[key]) : '');
  const [draft, setDraft] = useState<Record<SpecKey, string>>(() =>
    Object.fromEntries(SPEC_FIELDS.map(({ key }) => [key, saved(key)])) as Record<SpecKey, string>);
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const custom = SPEC_FIELDS.some(({ key }) => saved(key) !== '');

  const commit = (key: SpecKey) => {
    if (draft[key] === saved(key)) return;
    const n = Number(draft[key]);
    const value = draft[key].trim() === '' ? null : n;
    if (value !== null && !(Number.isInteger(n) && n >= 1 && n <= 50)) {
      setState({ kind: 'error', message: 'use um número inteiro de 1 a 50' });
      return;
    }
    setState({ kind: 'saving' });
    patch({ [key]: value })
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
            <input type="number" min={1} max={50} value={draft[key]} placeholder={String(defaults[key])}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              onBlur={() => commit(key)} className={inputClass} />
          </div>
        ))}
      </div>
      <p className="font-body text-[11px] text-on-surface-variant/60 mt-1">
        Usados quando o apartamento não tem os números do Airbnb; o número de hóspedes limita a busca da coleção. Vazio = número atual (em cinza).
      </p>
    </div>
  );
}

/**
 * Building/collection content stored on the Property row (headline, amenities,
 * distances, specs). Each field shows what the site shows today; NULL columns
 * fall back to the built-in data in properties.ts.
 */
export function PropertyContentFields({ property, api, onChanged }: {
  property: AdminProperty;
  api: Api;
  onChanged: (property: AdminProperty) => void;
}) {
  const builtIn = getPropertyBySlug(property.slug);
  if (!builtIn) return null;

  const patch = async (fields: Record<string, unknown>) => {
    const res = await api(`/admin/properties/${encodeURIComponent(property.slug)}`, { method: 'PATCH', body: JSON.stringify(fields) });
    onChanged(res.property);
  };
  // Adapter so the generic content fields (key/value, undefined = restore) can
  // write Property columns. Lists are converted to the stored shapes.
  const save: SaveContent = (key, value) => {
    if (key === 'amenities') {
      const rows = value as { item: string }[] | undefined;
      return patch({ amenities: rows ? rows.map((r) => r.item) : null });
    }
    return patch({ [key]: value === undefined ? null : value });
  };
  const amenities = readAmenities(property.amenities);
  const nearby = readNearby(property.nearby);

  return (
    <div className="grid gap-5">
      <ContentTextField def={{ kind: 'textarea', key: 'headline', label: 'Headline', hint: 'Frase abaixo do nome, no topo da página da coleção.' }}
        saved={property.headline} onSave={save} fallback={builtIn.headline} />
      <ContentListField def={{ kind: 'list', key: 'amenities', label: 'Amenidades', columns: [{ key: 'item', label: 'Amenidade', wide: true }], hint: 'Mostradas na página de cada apartamento deste prédio.' }}
        saved={amenities?.map((item) => ({ item }))} onSave={save} fallback={builtIn.amenities.map((item) => ({ item }))} />
      <ContentListField def={{ kind: 'list', key: 'nearby', label: 'Distâncias', columns: [{ key: 'location', label: 'Local', wide: true }, { key: 'time', label: 'Tempo (ex.: 5 min walk)' }], hint: 'Seção "The Neighborhood" da coleção e dos apartamentos (os 3 primeiros).' }}
        saved={nearby} onSave={save} fallback={builtIn.distances.map((d) => ({ location: d.location, time: d.time }))} />
      <SpecsEditor property={property} patch={patch}
        defaults={{ maxGuests: builtIn.maxGuests, bedrooms: builtIn.bedrooms, beds: builtIn.beds, bathrooms: builtIn.bathrooms }} />
    </div>
  );
}
