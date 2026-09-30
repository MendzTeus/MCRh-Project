import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudDownload, ArrowRight } from 'lucide-react';
import type { useApi } from '../../../hooks/useAdminApi';
import type { Unit } from '../sections/shared';
import { Badge, Button, Card, Notice, SectionHeading, fieldInput } from '../ui';

type Api = ReturnType<typeof useApi>;
type Row = Unit;
type RunState = { done: number; total: number; current: string; copied: number; retired: number; failed: string[] } | null;

/**
 * Photo health of every apartment + one-click refresh from Airbnb. Editing
 * happens on each apartment's "Fotos" tab.
 */
export function PhotosOverview({ units, api, onReload }: { units: Row[]; api: Api; onReload: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [run, setRun] = useState<RunState>(null);
  const [finished, setFinished] = useState<RunState>(null);

  const rows = useMemo(() => units
    .map((u) => {
      const photos = u.photos || [];
      const visible = photos.filter((p) => !p.hidden);
      return {
        unit: u,
        cover: photos.find((p) => p.isPrimary) || visible[0] || photos[0],
        total: photos.length,
        links: visible.filter((p) => !p.storagePath).length,
        noRoom: visible.filter((p) => !p.roomCategory).length,
      };
    })
    .filter(({ unit }) => `${unit.unitName} ${unit.propertyName} ${unit.unitSlug}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.unit.propertyName.localeCompare(b.unit.propertyName) || a.unit.unitName.localeCompare(b.unit.unitName)), [units, query]);

  const needsRefresh = units.filter((u) => {
    const visible = (u.photos || []).filter((p) => !p.hidden);
    return visible.length === 0 || visible.some((p) => !p.storagePath);
  });

  async function refreshAll(list: Row[]) {
    const state = { done: 0, total: list.length, current: '', copied: 0, retired: 0, failed: [] as string[] };
    setFinished(null);
    for (const u of list) {
      state.current = u.unitName;
      setRun({ ...state });
      try {
        const res = await api(`/admin/units/${u.unitSlug}/photos/import-from-airbnb`, { method: 'POST' });
        state.copied += res.imported || 0;
        state.retired += res.retired || 0;
        if (res.failed?.length) state.failed.push(`${u.unitName}: ${res.failed.length} foto(s) não copiada(s)`);
      } catch (err) {
        state.failed.push(`${u.unitName}: ${(err as Error).message}`);
      }
      state.done++;
    }
    setRun(null);
    setFinished({ ...state });
    await onReload();
  }

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeading
          title="Fotos guardadas no site"
          description="As fotos do Airbnb eram só links: quando o anfitrião troca uma foto no Airbnb, o link quebra e a foto some do site. “Buscar no Airbnb” lê cada anúncio agora e guarda uma cópia das fotos atuais no site."
          actions={
            <Button variant="primary" icon={<CloudDownload size={16} />} busy={Boolean(run)} disabled={!needsRefresh.length}
              onClick={() => refreshAll(needsRefresh)}>
              Buscar no Airbnb ({needsRefresh.length} apartamento{needsRefresh.length === 1 ? '' : 's'})
            </Button>
          } />
        {run && (
          <div className="mt-2">
            <div className="h-2 rounded-full bg-ad-sunken overflow-hidden">
              <div className="h-full bg-ad-ink transition-[width] duration-500" style={{ width: `${(run.done / run.total) * 100}%` }} />
            </div>
            <p className="text-sm text-ad-muted mt-2">{run.done} de {run.total} · agora: {run.current} · {run.copied} fotos copiadas. Pode levar alguns minutos — mantenha esta aba aberta.</p>
          </div>
        )}
        {finished && (
          <Notice tone={finished.failed.length ? 'warn' : 'ok'} title={`${finished.copied} fotos copiadas em ${finished.total} apartamento(s)${finished.retired ? ` · ${finished.retired} fotos antigas quebradas ocultadas` : ''}.`}>
            {finished.failed.length > 0 && <ul className="list-disc pl-5 mt-1">{finished.failed.slice(0, 8).map((f) => <li key={f}>{f}</li>)}</ul>}
            {!finished.failed.length && 'Depois, organize as fotos por cômodo em cada apartamento.'}
          </Notice>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar apartamento ou prédio…" className={`${fieldInput} max-w-sm`} />
        <span className="text-sm text-ad-muted">{rows.length} apartamento(s)</span>
      </div>

      <Card padded={false}>
        <ul className="divide-y divide-ad-line/70">
          {rows.map(({ unit, cover, total, links, noRoom }) => (
            <li key={unit.unitSlug}>
              <Link to={`/admin/apartments/${unit.unitSlug}?tab=photos`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-ad-sunken/50 transition-colors focus-visible:outline-none focus-visible:bg-ad-sunken">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-ad-sunken shrink-0">
                  {cover && <img src={cover.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ad-ink truncate">{unit.unitName}</p>
                  <p className="text-xs text-ad-muted truncate">{unit.propertyName}</p>
                </div>
                <div className="hidden sm:flex flex-wrap justify-end gap-1.5">
                  {total === 0 && <Badge tone="warn">Sem fotos salvas</Badge>}
                  {total > 0 && <Badge>{total} fotos</Badge>}
                  {links > 0 && <Badge tone="warn">{links} só link do Airbnb</Badge>}
                  {total > 0 && links === 0 && <Badge tone="ok">Guardadas no site</Badge>}
                  {noRoom > 0 && <Badge>{noRoom} sem cômodo</Badge>}
                </div>
                <ArrowRight size={16} className="text-ad-faint shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
