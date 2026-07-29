import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, ChevronRight, User, Mail, Phone, Calendar, MessageSquare,
  StickyNote, Inbox,
} from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavigation';
import { useApi } from '../hooks/useAdminApi';
import { useAdminAuth } from '../components/admin/AdminAuthContext';

const GOLD = '#c5a059';
const NAVY = '#101c2d';

type LeadStatus = 'new' | 'contacted' | 'closed';

type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  apartmentName?: string | null;
  unitSlug?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  nights?: number | null;
  message?: string | null;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
};

// ── Status badge ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<LeadStatus, { bg: string; color: string; label: string }> = {
  new:       { bg: `${GOLD}18`, color: GOLD,          label: 'New' },
  contacted: { bg: '#EDF5FF',   color: '#1565C0',     label: 'Contacted' },
  closed:    { bg: `${NAVY}10`, color: `${NAVY}70`,   label: 'Closed' },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.new;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full font-body text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-1"
      style={{ border: `1px solid ${NAVY}08`, borderTop: accent ? `2px solid ${GOLD}` : undefined }}>
      <p className="font-display text-3xl font-bold" style={{ color: accent ? GOLD : NAVY }}>{value}</p>
      <p className="font-body text-xs uppercase tracking-widest" style={{ color: `${NAVY}60` }}>{label}</p>
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────
function DetailPanel({ lead, onClose, onStatusChange }: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  const nights = lead.nights
    ?? (lead.checkIn && lead.checkOut
      ? Math.round((new Date(lead.checkOut).getTime() - new Date(lead.checkIn).getTime()) / 86400000)
      : null);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      style={{ borderLeft: '1px solid rgba(16,28,45,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: `${NAVY}08` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: `${GOLD}18` }}>
            <User size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <p className="font-body text-sm font-semibold" style={{ color: NAVY }}>{lead.name}</p>
            <p className="font-body text-[11px]" style={{ color: `${NAVY}50` }}>
              Created {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={16} style={{ color: `${NAVY}50` }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {/* Contact */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail size={14} style={{ color: `${NAVY}40` }} />
            <a href={`mailto:${lead.email}`} className="font-body text-sm hover:underline" style={{ color: NAVY }}>{lead.email}</a>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone size={14} style={{ color: `${NAVY}40` }} />
              <a href={`tel:${lead.phone}`} className="font-body text-sm" style={{ color: NAVY }}>{lead.phone}</a>
            </div>
          )}
        </div>

        <hr style={{ borderColor: `${NAVY}08` }} />

        {/* Stay details */}
        <div className="space-y-3">
          {lead.apartmentName && (
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${NAVY}50` }}>Apartment</p>
              <p className="font-body text-sm" style={{ color: NAVY }}>{lead.apartmentName}</p>
            </div>
          )}
          {(lead.checkIn || lead.checkOut) && (
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${NAVY}50` }}>Stay Dates</p>
              <div className="flex items-center gap-2">
                <Calendar size={13} style={{ color: `${NAVY}40` }} />
                <p className="font-body text-sm" style={{ color: NAVY }}>
                  {lead.checkIn ?? '?'} — {lead.checkOut ?? '?'}
                  {nights != null && <span style={{ color: `${NAVY}50` }}> ({nights} {nights === 1 ? 'night' : 'nights'})</span>}
                </p>
              </div>
            </div>
          )}
        </div>

        {lead.message && (
          <>
            <hr style={{ borderColor: `${NAVY}08` }} />
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${NAVY}50` }}>
                Message / Guest Notes
              </p>
              <div className="flex gap-2">
                <MessageSquare size={13} className="flex-shrink-0 mt-0.5" style={{ color: `${NAVY}40` }} />
                <p className="font-body text-sm italic" style={{ color: `${NAVY}70` }}>"{lead.message}"</p>
              </div>
            </div>
          </>
        )}

        <hr style={{ borderColor: `${NAVY}08` }} />

        {/* Status */}
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${NAVY}50` }}>Change Status</p>
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
            className="w-full bg-[#f9f7f2] border border-navy/10 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none transition-all"
            style={{ color: NAVY }}>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Notes */}
        {lead.notes && (
          <>
            <hr style={{ borderColor: `${NAVY}08` }} />
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${NAVY}50` }}>
                Internal Staff Notes
              </p>
              <div className="flex gap-2">
                <StickyNote size={13} className="flex-shrink-0 mt-0.5" style={{ color: `${NAVY}40` }} />
                <p className="font-body text-sm" style={{ color: `${NAVY}70` }}>{lead.notes}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
function LeadsPage() {
  const navigate = useNavigate();
  const { token, logout } = useAdminAuth();
  const api = useApi(token, logout);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [noApi, setNoApi] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | LeadStatus>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data: Lead[] = await api('/admin/leads', {});
      setLeads(data);
    } catch (err) {
      const msg = (err as Error).message || '';
      if (msg.includes('404') || msg.includes('HTTP 4')) setNoApi(true);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    new:       leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    closed:    leads.filter((l) => l.status === 'closed').length,
  }), [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (filterStatus && l.status !== filterStatus) return false;
      if (q && !(`${l.name} ${l.email} ${l.apartmentName || ''}`).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, search, filterStatus]);

  async function changeStatus(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
    try { await api(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
    catch { load(); }
  }

  const selCls = 'bg-[#f9f7f2] border border-navy/10 rounded-lg px-3 py-2.5 font-body text-sm text-navy focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20 transition-all';

  return (
    <AdminShell navItems={ADMIN_NAV_ITEMS} activeId="leads" breadcrumbs={[{ label: 'Leads' }]}>
      {/* Panel overlay */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <DetailPanel lead={selected} onClose={() => setSelected(null)} onStatusChange={changeStatus} />
        </>
      )}

      {/* Page header */}
      <div className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-8 pt-8 pb-6 mb-8"
        style={{ background: '#f9f7f2', borderBottom: '1px solid rgba(16,28,45,0.07)' }}>
        <h2 className="font-display text-3xl font-bold mb-1" style={{ color: NAVY }}>Leads</h2>
        <p className="font-body text-sm" style={{ color: `${NAVY}70` }}>Review and manage potential guest inquiries</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="New" value={counts.new} accent />
        <StatCard label="Contacted" value={counts.contacted} />
        <StatCard label="Closed" value={counts.closed} />
      </div>

      {noApi ? (
        <div className="bg-white rounded-xl shadow-sm flex flex-col items-center justify-center py-20"
          style={{ border: '1px solid rgba(16,28,45,0.05)' }}>
          <Inbox size={36} className="mb-4" style={{ color: `${NAVY}25` }} />
          <p className="font-body text-sm font-semibold mb-1" style={{ color: NAVY }}>Leads API not available</p>
          <p className="font-body text-xs text-center max-w-xs" style={{ color: `${NAVY}50` }}>
            The <code className="font-mono">/api/admin/leads</code> endpoint has not been implemented yet.
            Leads will appear here once the API is ready.
          </p>
        </div>
      ) : (
        <>
          {/* Filter row */}
          <div className="flex flex-wrap gap-3 mb-5 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: `${NAVY}50` }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, apartment…"
                className={`${selCls} pl-9 w-full`} />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as '' | LeadStatus)} className={selCls}>
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
            {(search || filterStatus) && (
              <button onClick={() => { setSearch(''); setFilterStatus(''); }}
                className="flex items-center gap-1.5 font-body text-xs px-3 py-2.5 rounded-lg border transition-colors hover:bg-red-50"
                style={{ borderColor: `${NAVY}20`, color: `${NAVY}70` }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <p className="font-body text-xs mb-4" style={{ color: `${NAVY}50` }}>
            {filtered.length} of {leads.length} leads
          </p>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(16,28,45,0.05)' }}>
            {loading ? (
              <div className="divide-y" style={{ borderColor: `${NAVY}08` }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-5 animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-40" />
                      <div className="h-2 bg-gray-100 rounded w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-body text-sm" style={{ color: `${NAVY}50` }}>No leads found.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="hidden md:grid grid-cols-[1fr_140px_160px_100px_40px] gap-4 items-center px-6 py-3 border-b"
                  style={{ borderColor: `${NAVY}08`, background: '#fafaf9' }}>
                  {['Name', 'Dates', 'Apartment', 'Status', ''].map((h) => (
                    <span key={h} className="font-label text-[10px] font-bold uppercase tracking-widest" style={{ color: `${NAVY}50` }}>{h}</span>
                  ))}
                </div>

                <div className="divide-y" style={{ borderColor: `${NAVY}06` }}>
                  {filtered.map((l) => {
                    const nights = l.nights ?? (l.checkIn && l.checkOut
                      ? Math.round((new Date(l.checkOut).getTime() - new Date(l.checkIn).getTime()) / 86400000)
                      : null);
                    return (
                      <button key={l.id} onClick={() => setSelected(l)}
                        className="hidden md:grid w-full grid-cols-[1fr_140px_160px_100px_40px] gap-4 items-center px-6 py-4 text-left hover:bg-gray-50/70 transition-colors">
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold truncate" style={{ color: NAVY }}>{l.name}</p>
                          <p className="font-body text-xs truncate" style={{ color: `${NAVY}50` }}>{l.email}</p>
                        </div>
                        <div>
                          {l.checkIn && (
                            <>
                              <p className="font-body text-xs" style={{ color: NAVY }}>
                                {l.checkIn} → {l.checkOut ?? '?'}
                              </p>
                              {nights != null && (
                                <p className="font-body text-[10px]" style={{ color: `${NAVY}50` }}>{nights} nights</p>
                              )}
                            </>
                          )}
                        </div>
                        <p className="font-body text-xs truncate" style={{ color: NAVY }}>{l.apartmentName || '—'}</p>
                        <StatusBadge status={l.status} />
                        <ChevronRight size={14} style={{ color: `${NAVY}30` }} />
                      </button>
                    );
                  })}

                  {/* Mobile */}
                  {filtered.map((l) => (
                    <button key={`m-${l.id}`} onClick={() => setSelected(l)}
                      className="md:hidden w-full px-4 py-4 text-left flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold" style={{ color: NAVY }}>{l.name}</p>
                        <p className="font-body text-xs mb-1" style={{ color: `${NAVY}50` }}>{l.email}</p>
                        {l.apartmentName && <p className="font-body text-xs" style={{ color: `${NAVY}60` }}>{l.apartmentName}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={l.status} />
                        <ChevronRight size={14} style={{ color: `${NAVY}30` }} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}

// ── Export ────────────────────────────────────────────────────────────
export default function AdminLeads() {
  return <LeadsPage />;
}
