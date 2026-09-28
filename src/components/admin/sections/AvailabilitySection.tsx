// Split out of the former single-file admin (src/pages/Admin.tsx).
import { useEffect, useState } from 'react';
import type { useApi } from '../../../hooks/useAdminApi';
import { GOLD, NAVY } from './shared';

// ── Availability / iCal sync ────────────────────────────────────────
type AvailRow = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  hasIcal: boolean; lastSyncedAt: string | null; blockedCount: number;
};

export function AvailabilityTab({ api }: { api: ReturnType<typeof useApi> }) {
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null); // 'all' | unitSlug | null

  async function load() {
    setLoading(true);
    const data = await api('/admin/availability');
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function syncAll() {
    setSyncing('all');
    try { await api('/admin/sync', { method: 'POST' }); await load(); }
    finally { setSyncing(null); }
  }

  async function syncOne(unitSlug: string) {
    setSyncing(unitSlug);
    try { await api(`/admin/sync/${unitSlug}`, { method: 'POST' }); await load(); }
    finally { setSyncing(null); }
  }

  const fmt = (ts: string | null) => ts
    ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'nunca';

  const groups: Record<string, AvailRow[]> = {};
  rows.forEach((r) => { (groups[r.propertyName] ||= []).push(r); });
  const withIcal = rows.filter((r) => r.hasIcal).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-body text-xs text-on-surface-variant">{withIcal}/{rows.length} com iCal configurado</span>
        <button onClick={syncAll} disabled={syncing !== null}
          className="ml-auto px-4 py-1.5 rounded-full font-body text-xs tracking-widest uppercase text-white transition-colors disabled:opacity-50"
          style={{ background: NAVY }}>
          {syncing === 'all' ? 'Sincronizando…' : 'Sincronizar tudo'}
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-on-surface-variant">Carregando…</p>
      ) : rows.length === 0 ? (
        <div className="border border-outline-variant/30 rounded-xl px-6 py-12 text-center">
          <p className="font-body text-sm text-on-surface-variant">Nenhuma unidade encontrada.</p>
        </div>
      ) : (
        Object.entries(groups).map(([propertyName, groupRows]) => (
          <div key={propertyName} className="space-y-3">
            <div className="flex items-center gap-4">
              <h2 className="font-display text-headline-sm text-primary whitespace-nowrap">{propertyName}</h2>
              <div className="flex-1 h-px" style={{ background: `${GOLD}55` }} />
            </div>
            {groupRows.map((r) => (
              <div key={r.unitSlug} className="border border-outline-variant/30 rounded-xl shadow-sm p-5 bg-surface-container-lowest flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-display text-headline-sm text-primary">{r.unitName}</p>
                  <div className="flex flex-wrap gap-3 font-body text-xs text-on-surface-variant mt-1">
                    <span className="px-2 py-0.5 rounded-full text-white" style={{ background: r.hasIcal ? '#3f7d5b' : '#9ca3af' }}>
                      {r.hasIcal ? 'iCal configurado' : 'sem iCal'}
                    </span>
                    <span className="bg-surface-dim px-2 py-0.5 rounded">{r.blockedCount} período(s) bloqueado(s)</span>
                    <span className="opacity-60">último sync: {fmt(r.lastSyncedAt)}</span>
                  </div>
                </div>
                <button onClick={() => syncOne(r.unitSlug)} disabled={!r.hasIcal || syncing !== null}
                  className="font-body text-[10px] tracking-widest uppercase px-3 py-1.5 border border-outline-variant/40 rounded hover:border-primary transition-colors text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:hover:border-outline-variant/40 disabled:hover:text-on-surface-variant">
                  {syncing === r.unitSlug ? 'Sincronizando…' : 'Sincronizar'}
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
