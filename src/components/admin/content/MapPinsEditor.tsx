import { useState } from 'react';
import { mapLocationDefaults, type MapLocationOverride } from '../../../data/locations';
import { SaveStatus, inputClass, labelClass, type SaveContent, type SaveState } from './ContentFields';

type Overrides = Record<string, MapLocationOverride>;

// Overrides lat/lng/postcode per map pin (defaults come from locations.ts).
// Only overridden fields are stored under `map.locations`; an empty field
// falls back to the built-in default, so the map never breaks.
export function MapPinsEditor({ saved, onSave }: { saved: unknown; onSave: SaveContent }) {
  const [draft, setDraft] = useState<Overrides>(() => (saved && typeof saved === 'object' ? (saved as Overrides) : {}));
  const [state, setState] = useState<SaveState>({ kind: 'idle' });

  const setField = (id: number, field: 'lat' | 'lng' | 'postcode', value: string) => {
    const current: MapLocationOverride = { ...(draft[String(id)] || {}) };
    if (field === 'postcode') {
      if (value.trim()) current.postcode = value.trim(); else delete current.postcode;
    } else {
      const n = parseFloat(value);
      if (Number.isFinite(n)) current[field] = n; else delete current[field];
    }
    const next = { ...draft };
    if (Object.keys(current).length) next[String(id)] = current; else delete next[String(id)];
    if (JSON.stringify(next) === JSON.stringify(draft)) return;
    setDraft(next);
    setState({ kind: 'saving' });
    onSave('map.locations', Object.keys(next).length ? next : undefined)
      .then(() => setState({ kind: 'saved' }))
      .catch((err: Error) => setState({ kind: 'error', message: err.message }));
  };

  return (
    <div className="bg-white border border-outline-variant/30 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="font-body text-xs text-on-surface-variant">
          Coordenadas e postcode de cada pin dos mapas da Home e das coleções. Campo vazio volta ao valor padrão.
        </p>
        <SaveStatus state={state} />
      </div>
      <div className="grid gap-3">
        {mapLocationDefaults.map((pin) => {
          const o = draft[String(pin.id)] || {};
          return (
            <div key={pin.id} className="border border-outline-variant/25 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-3">
                <p className="font-display text-lg text-primary">{pin.name}</p>
                <p className="font-body text-[11px] text-on-surface-variant/60">{pin.area}</p>
                {Object.keys(o).length > 0 && (
                  <span className="font-body text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded" style={{ background: '#C5A05922', color: '#826927' }}>Personalizado</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Latitude</label>
                  <input type="number" step="0.0001" defaultValue={o.lat ?? pin.coordinates.lat}
                    onBlur={(e) => setField(pin.id, 'lat', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input type="number" step="0.0001" defaultValue={o.lng ?? pin.coordinates.lng}
                    onBlur={(e) => setField(pin.id, 'lng', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Postcode</label>
                  <input defaultValue={o.postcode ?? pin.postcode}
                    onBlur={(e) => setField(pin.id, 'postcode', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
