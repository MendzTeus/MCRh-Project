import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Star, ArrowRight, UserSearch, TrendingUp, Plus } from 'lucide-react';
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

// ── Occupancy line chart (static decorative) ─────────────────────────
const CHART_POINTS = [
  { label: 'JAN', pct: 62 }, { label: 'FEB', pct: 68 }, { label: 'MAR', pct: 74 },
  { label: 'APR', pct: 85 }, { label: 'MAY', pct: 91 }, { label: 'JUN', pct: 79 },
  { label: 'JUL', pct: 88 },
];

function OccupancyChart() {
  const W = 600; const H = 160; const PAD = 16;
  const xs = CHART_POINTS.map((_, i) => PAD + (i / (CHART_POINTS.length - 1)) * (W - PAD * 2));
  const ys = CHART_POINTS.map((p) => H - PAD - (p.pct / 100) * (H - PAD * 2));
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const area = `${line} L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`;

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm mb-8" style={{ border: `1px solid ${NAVY}08` }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-headline text-xl font-bold" style={{ color: NAVY }}>Occupancy Trends</h4>
          <p className="font-body text-sm mt-0.5" style={{ color: `${NAVY}40` }}>
            Monthly performance across all boutique properties
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 font-body text-xs font-bold rounded border" style={{ borderColor: `${NAVY}12`, color: `${NAVY}50` }}>Yearly</button>
          <button className="px-3 py-1 font-body text-xs font-bold rounded" style={{ background: NAVY, color: 'white' }}>Monthly</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[25, 50, 75, 100].map((pct) => {
          const y = H - PAD - (pct / 100) * (H - PAD * 2);
          return <line key={pct} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke={`${NAVY}08`} strokeWidth={1} />;
        })}
        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.15" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        {/* Line */}
        <path d={line} fill="none" stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={4} fill={GOLD} stroke="white" strokeWidth={2} />
        ))}
        {/* X labels */}
        {CHART_POINTS.map((p, i) => (
          <text key={i} x={xs[i]} y={H + 20} textAnchor="middle"
            className="font-label" fontSize={10} fill={`${NAVY}50`} fontWeight={700}>
            {p.label}
          </text>
        ))}
      </svg>
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
  const [pendingLeads, setPendingLeads] = useState<number | null>(null);
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
      if (l.status === 'fulfilled' && Array.isArray(l.value)) {
        setPendingLeads(l.value.filter((lead: { status: string }) => lead.status === 'new').length);
      }
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
  const recentReviews = [...publishedReviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <AdminShell
      navItems={ADMIN_NAV_ITEMS}
      activeId="dashboard"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
      rightSlot={
        <button
          onClick={logout}
          className="font-body text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors"
        >
          Sair
        </button>
      }
    >
      <div style={{ background: CREAM, minHeight: '100%' }} className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-10 pt-10 pb-12">

        {/* Page header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-headline text-4xl font-bold" style={{ color: NAVY }}>Dashboard</h2>
            <p className="font-body text-sm mt-1" style={{ color: `${NAVY}50` }}>
              Welcome back. Here is what's happening with your properties today.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/apartments')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-body font-semibold text-sm transition-all active:scale-95 shadow-md"
            style={{ background: GOLD, color: NAVY }}
          >
            <Plus size={16} />
            New Property
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
              label="Total Apartments"
              value={totalUnits}
              sub={`${visibleUnits} published · ${totalUnits - visibleUnits} hidden`}
            />
            <StatCard
              icon={UserSearch}
              label="Pending Leads"
              value={pendingLeads ?? '—'}
              accent
              sub={pendingLeads != null && pendingLeads > 0 ? 'Needs immediate response' : 'No pending leads'}
              subColor={pendingLeads != null && pendingLeads > 0 ? '#d97706' : undefined}
            />
            <StatCard
              icon={Star}
              label="Recent Reviews"
              value={publishedReviews.length > 0 ? `${publishedReviews.length} ⭐ ${avgRating}` : '—'}
              sub={publishedReviews.length > 0 ? 'Based on self-managed units' : 'No reviews yet'}
            />
            <StatCard
              icon={TrendingUp}
              label="Occupancy Rate"
              value={`${visiblePct}%`}
              sub="Based on self-managed units"
              subColor={visiblePct >= 80 ? '#16a34a' : visiblePct >= 50 ? GOLD : '#dc2626'}
            />
          </div>
        )}

        {/* Occupancy line chart */}
        <OccupancyChart />

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Leads table */}
          <div
            className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
            style={{ border: `1px solid ${NAVY}08` }}
          >
            <div className="p-6 flex justify-between items-center border-b" style={{ borderColor: `${NAVY}08` }}>
              <h4 className="font-headline text-xl font-bold" style={{ color: NAVY }}>Recent Leads</h4>
              <button
                onClick={() => navigate('/admin/leads')}
                className="flex items-center gap-1 font-body text-xs font-bold uppercase tracking-wider transition-colors hover:underline"
                style={{ color: GOLD }}
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: `${NAVY}06` }}>
                    {['Lead Name', 'Apartment', 'Status', 'Date'].map((h) => (
                      <th key={h} className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-widest" style={{ color: `${NAVY}40` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: `${NAVY}08` }}>
                  {pendingLeads === null && loading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center font-body text-sm" style={{ color: `${NAVY}30` }}>Loading…</td></tr>
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center">
                        <p className="font-body text-sm" style={{ color: `${NAVY}40` }}>No recent leads.</p>
                        <p className="font-body text-xs mt-1" style={{ color: `${NAVY}25` }}>Leads will appear here when the API is enabled.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews feed */}
          <div className="bg-white rounded-xl shadow-sm flex flex-col" style={{ border: `1px solid ${NAVY}08` }}>
            <div className="p-6 border-b" style={{ borderColor: `${NAVY}08` }}>
              <h4 className="font-headline text-xl font-bold" style={{ color: NAVY }}>Guest Reviews</h4>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
              {recentReviews.length === 0 ? (
                <p className="font-body text-sm text-center py-8" style={{ color: `${NAVY}30` }}>
                  {loading ? 'Loading…' : 'No reviews yet.'}
                </p>
              ) : (
                recentReviews.slice(0, 4).map((r, i) => {
                  const initials = (r.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                  const dateStr = r.date
                    ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
                            <p className="font-body text-sm font-bold" style={{ color: NAVY }}>{r.name || 'Anonymous'}</p>
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

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center" style={{ borderColor: `${NAVY}08` }}>
          <p className="font-body text-xs uppercase tracking-widest" style={{ color: `${NAVY}25` }}>
            MCRh Boutique Property Management
          </p>
        </footer>
      </div>
    </AdminShell>
  );
}

// ── Export ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  return <Dashboard />;
}
