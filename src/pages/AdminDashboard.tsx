import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Star, ArrowRight, UserSearch, TrendingUp } from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavigation';
import { useApi } from '../hooks/useAdminApi';
import { useAdminAuth } from '../components/admin/AdminAuthContext';

const GOLD = '#c5a059';
const NAVY = '#101c2d';
const CREAM = '#f9f8f4';

type Unit = { unitSlug: string; unitName: string; propertySlug: string; propertyName: string; visible: boolean };
type Review = {
  id: string; name: string | null; date: string | null; text: string | null;
  rating: number; published: boolean; avatarUrl: string | null; propertySlug: string;
  unitSlug?: string | null; createdAt: string;
};
type Lead = {
  id: string; name: string; email: string; propertyName: string | null;
  status: 'new' | 'contacted' | 'closed'; createdAt: string;
};
const LEAD_STATUS_STYLE: Record<Lead['status'], { label: string; color: string; bg: string }> = {
  new:       { label: 'Novo',        color: GOLD,      bg: `${GOLD}18` },
  contacted: { label: 'Respondido',  color: '#1565C0', bg: '#EDF5FF' },
  closed:    { label: 'Encerrado',   color: `${NAVY}70`, bg: `${NAVY}10` },
};

// ── Stars ────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} fill={i <= rating ? GOLD : 'none'} color={GOLD} strokeWidth={1.5} />
      ))}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, subColor, accent,
}: {
  icon: typeof Building2; label: string; value: string | number; sub: string;
  subColor?: string; accent?: boolean;
}) {
  return (
    <div
      className="bg-white p-6 rounded-xl shadow-sm flex flex-col gap-4 transition-shadow hover:shadow-md"
      style={{ border: `1px solid ${NAVY}08` }}
    >
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: accent ? `${GOLD}18` : `${NAVY}08` }}
      >
        <Icon size={22} color={accent ? GOLD : NAVY} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-label text-[10px] uppercase tracking-widest mb-1" style={{ color: `${NAVY}60` }}>{label}</p>
        <p className="font-headline text-4xl font-bold" style={{ color: accent ? GOLD : NAVY }}>{value}</p>
      </div>
      <p className="font-body text-xs font-semibold" style={{ color: subColor ?? `${NAVY}40` }}>{sub}</p>
    </div>
  );
}

// ── Dashboard content ────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAdminAuth();
  const api = useApi(token, logout);

  const [units, setUnits] = useState<Unit[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [u, r, l] = await Promise.allSettled([
        api('/admin/units'),
        api('/admin/reviews'),
        api('/admin/leads'),
      ]);
      if (u.status === 'fulfilled' && Array.isArray(u.value?.units)) setUnits(u.value.units);
      if (r.status === 'fulfilled' && Array.isArray(r.value)) setReviews(r.value);
      if (l.status === 'fulfilled' && Array.isArray(l.value)) setLeads(l.value);
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const totalUnits = units.length;
  const visibleUnits = units.filter((u) => u.visible).length;
  const visiblePct = totalUnits > 0 ? Math.round((visibleUnits / totalUnits) * 100) : 0;
  const publishedReviews = reviews.filter((r) => r.published);
  const avgRating = publishedReviews.length > 0
    ? (publishedReviews.reduce((s, r) => s + r.rating, 0) / publishedReviews.length).toFixed(1)
    : '–';
  const pendingLeads = leads ? leads.filter((lead) => lead.status === 'new').length : null;
  const recentLeads = (leads || []).slice(0, 5); // API returns newest first
  const recentReviews = [...publishedReviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <AdminShell
      navItems={ADMIN_NAV_ITEMS}
      activeId="dashboard"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Painel' }]}
    >
      <div style={{ background: CREAM, minHeight: '100%' }} className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-10 pt-10 pb-12">

        {/* Page header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline text-4xl font-bold" style={{ color: NAVY }}>Painel</h2>
            <p className="font-body text-sm mt-1" style={{ color: `${NAVY}50` }}>
              Resumo do que precisa de atenção no site hoje.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/apartments')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-body font-semibold text-sm transition-all active:scale-95 shadow-md"
            style={{ background: GOLD, color: NAVY }}
          >
            <Building2 size={16} />
            Ver apartamentos
          </button>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl h-40 animate-pulse" style={{ border: `1px solid ${NAVY}08` }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Building2}
              label="Apartamentos"
              value={totalUnits}
              sub={`${visibleUnits} publicados · ${totalUnits - visibleUnits} ocultos`}
            />
            <StatCard
              icon={UserSearch}
              label="Leads sem resposta"
              value={pendingLeads ?? '—'}
              accent
              sub={pendingLeads != null && pendingLeads > 0 ? 'Precisam de resposta' : 'Nenhum pendente'}
              subColor={pendingLeads != null && pendingLeads > 0 ? '#d97706' : undefined}
            />
            <StatCard
              icon={Star}
              label="Avaliações publicadas"
              value={publishedReviews.length > 0 ? `${publishedReviews.length} ⭐ ${avgRating}` : '—'}
              sub={publishedReviews.length > 0 ? 'Média das notas publicadas' : 'Nenhuma avaliação ainda'}
            />
            <StatCard
              icon={TrendingUp}
              label="Apartamentos publicados"
              value={`${visiblePct}%`}
              sub="Visíveis no site agora"
              subColor={visiblePct >= 80 ? '#16a34a' : visiblePct >= 50 ? GOLD : '#dc2626'}
            />
          </div>
        )}

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Leads table */}
          <div
            className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
            style={{ border: `1px solid ${NAVY}08` }}
          >
            <div className="p-6 flex justify-between items-center border-b" style={{ borderColor: `${NAVY}08` }}>
              <h4 className="font-headline text-xl font-bold" style={{ color: NAVY }}>Leads recentes</h4>
              <button
                onClick={() => navigate('/admin/leads')}
                className="flex items-center gap-1 font-body text-xs font-bold uppercase tracking-wider transition-colors hover:underline"
                style={{ color: GOLD }}
              >
                Ver todos <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: `${NAVY}06` }}>
                    {['Nome', 'Assunto', 'Status', 'Data'].map((h) => (
                      <th key={h} className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-widest" style={{ color: `${NAVY}40` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#101c2d]/[0.06]">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center font-body text-sm" style={{ color: `${NAVY}30` }}>Carregando…</td></tr>
                  ) : leads === null ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center font-body text-sm" style={{ color: '#b91c1c' }}>Não foi possível carregar os leads.</td></tr>
                  ) : recentLeads.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center font-body text-sm" style={{ color: `${NAVY}40` }}>Nenhum lead ainda.</td></tr>
                  ) : (
                    recentLeads.map((lead) => {
                      const st = LEAD_STATUS_STYLE[lead.status] ?? LEAD_STATUS_STYLE.new;
                      return (
                        <tr key={lead.id} onClick={() => navigate('/admin/leads')} className="cursor-pointer hover:bg-gray-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-body text-sm font-semibold" style={{ color: NAVY }}>{lead.name}</p>
                            <p className="font-body text-xs" style={{ color: `${NAVY}50` }}>{lead.email}</p>
                          </td>
                          <td className="px-6 py-4 font-body text-sm" style={{ color: NAVY }}>{lead.propertyName || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-1 rounded-full font-body text-[10px] font-semibold uppercase tracking-wide"
                              style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </td>
                          <td className="px-6 py-4 font-body text-xs" style={{ color: `${NAVY}60` }}>
                            {new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews feed */}
          <div className="bg-white rounded-xl shadow-sm flex flex-col" style={{ border: `1px solid ${NAVY}08` }}>
            <div className="p-6 border-b" style={{ borderColor: `${NAVY}08` }}>
              <h4 className="font-headline text-xl font-bold" style={{ color: NAVY }}>Avaliações recentes</h4>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
              {recentReviews.length === 0 ? (
                <p className="font-body text-sm text-center py-8" style={{ color: `${NAVY}30` }}>
                  {loading ? 'Carregando…' : 'Nenhuma avaliação ainda.'}
                </p>
              ) : (
                recentReviews.slice(0, 4).map((r, i) => {
                  const initials = (r.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                  const dateStr = r.date
                    ? new Date(r.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
                    : '–';
                  return (
                    <div key={r.id} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {r.avatarUrl ? (
                            <img src={r.avatarUrl} alt={r.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-body text-xs font-bold"
                              style={{ background: `${NAVY}08`, color: NAVY }}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-body text-sm font-bold" style={{ color: NAVY }}>{r.name || 'Anônimo'}</p>
                            <Stars rating={r.rating} />
                          </div>
                        </div>
                        <span className="font-label text-[10px] font-bold uppercase" style={{ color: `${NAVY}30` }}>
                          {dateStr}
                        </span>
                      </div>
                      {r.text && (
                        <p className="font-body text-sm italic leading-relaxed" style={{ color: `${NAVY}70` }}>
                          "{r.text.slice(0, 120)}{r.text.length > 120 ? '…' : ''}"
                        </p>
                      )}
                      <p className="font-label text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                        {r.propertySlug}
                      </p>
                      {i < recentReviews.slice(0, 4).length - 1 && (
                        <div className="h-px w-full" style={{ background: `${NAVY}06` }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminShell>
  );
}

// ── Export ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return <Dashboard />;
}
