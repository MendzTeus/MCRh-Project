import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, X, ChevronRight, User, Mail, Phone, Calendar, MessageSquare,
  Inbox, Users, ExternalLink, Trash2,
} from 'lucide-react';
import { AdminShell } from '../components/admin/AdminShell';
import { ADMIN_NAV_ITEMS } from '../components/admin/adminNavigation';
import { useApi } from '../hooks/useAdminApi';
import { useAdminAuth } from '../components/admin/AdminAuthContext';
import { ConfirmDialog } from '../components/admin/AdminUI';

const GOLD = '#c5a059';
const NAVY = '#101c2d';

type LeadStatus = 'new' | 'contacted' | 'closed';

// Mirrors the Enquiry table. The API always returns the canonical status
// (legacy novo/lido/arquivado rows are mapped server-side).
type Lead = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  propertyName?: string | null;
  unitSlug?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  guests?: number | null;
  message?: string | null;
  source?: string | null;
  status: LeadStatus;
  createdAt: string;
};

const SOURCE_LABELS: Record<string, string> = {
  'contact-form': 'Formulário de contato',
};

function nightsBetween(checkIn?: string | null, checkOut?: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  const n = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ── Status badge ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<LeadStatus, { bg: string; color: string; label: string }> = {
  new:       { bg: `${GOLD}18`, color: GOLD,          label: 'Novo' },
  contacted: { bg: '#EDF5FF',   color: '#1565C0',     label: 'Respondido' },
  closed:    { bg: `${NAVY}10`, color: `${NAVY}70`,   label: 'Encerrado' },
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
function DetailPanel({ lead, onClose, onStatusChange, onDelete }: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onDelete: (lead: Lead) => void;
}) {
  const nights = nightsBetween(lead.checkIn, lead.checkOut);
  const replySubject = encodeURIComponent(`Your enquiry${lead.propertyName && lead.propertyName !== 'General' ? ` — ${lead.propertyName}` : ''} | MCRh`);

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
              Recebido em {new Date(lead.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {lead.source && <> · {SOURCE_LABELS[lead.source] || lead.source}</>}
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
          {lead.propertyName && (
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${NAVY}50` }}>Assunto</p>
              <p className="font-body text-sm" style={{ color: NAVY }}>{lead.propertyName}</p>
              {lead.unitSlug && (
                <a href={`/property/${encodeURIComponent(lead.unitSlug)}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-body text-xs mt-1 hover:underline" style={{ color: GOLD }}>
                  Ver apartamento <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
          {lead.guests != null && (
            <div className="flex items-center gap-2">
              <Users size={13} style={{ color: `${NAVY}40` }} />
              <p className="font-body text-sm" style={{ color: NAVY }}>{lead.guests} {lead.guests === 1 ? 'hóspede' : 'hóspedes'}</p>
            </div>
          )}
          {(lead.checkIn || lead.checkOut) && (
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `${NAVY}50` }}>Datas da estadia</p>
              <div className="flex items-center gap-2">
                <Calendar size={13} style={{ color: `${NAVY}40` }} />
                <p className="font-body text-sm" style={{ color: NAVY }}>
                  {lead.checkIn ?? '?'} — {lead.checkOut ?? '?'}
                  {nights != null && <span style={{ color: `${NAVY}50` }}> ({nights} {nights === 1 ? 'noite' : 'noites'})</span>}
                </p>
              </div>
            </div>
          )}
        </div>

        {lead.message && (
          <>
            <hr style={{ borderColor: `${NAVY}08` }} />
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${NAVY}50` }}>
                Mensagem
              </p>
              <div className="flex gap-2">
                <MessageSquare size={13} className="flex-shrink-0 mt-0.5" style={{ color: `${NAVY}40` }} />
                <p className="font-body text-sm italic whitespace-pre-line" style={{ color: `${NAVY}70` }}>"{lead.message}"</p>
              </div>
            </div>
          </>
        )}

        <hr style={{ borderColor: `${NAVY}08` }} />

        {/* Status */}
        <div>
          <p className="font-body text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${NAVY}50` }}>Status</p>
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
            className="w-full bg-[#f9f7f2] border border-navy/10 rounded-lg px-3 py-2.5 font-body text-sm focus:outline-none transition-all"
            style={{ color: NAVY }}>
            <option value="new">Novo</option>
            <option value="contacted">Respondido</option>
            <option value="closed">Encerrado</option>
          </select>
        </div>

      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: `${NAVY}08` }}>
        <a href={`mailto:${lead.email}?subject=${replySubject}`}
          onClick={() => { if (lead.status === 'new') onStatusChange(lead.id, 'contacted'); }}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold"
          style={{ background: NAVY, color: 'white' }}>
          <Mail size={14} /> Responder por e-mail
        </a>
        <button onClick={() => onDelete(lead)} title="Excluir lead"
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg font-body text-xs border transition-colors hover:bg-red-50"
          style={{ borderColor: '#fecaca', color: '#b91c1c' }}>
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
function LeadsPage() {
  const { token, logout } = useAdminAuth();
  const api = useApi(token, logout);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | LeadStatus>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data: Lead[] = await api('/admin/leads', {});
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError((err as Error).message || 'Não foi possível carregar os leads');
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
      if (q && !(`${l.name} ${l.email} ${l.phone || ''} ${l.propertyName || ''} ${l.message || ''}`).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, search, filterStatus]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount);
  const pageLeads = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  async function changeStatus(id: string, status: LeadStatus) {
    setActionError(null);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
    try { await api(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
    catch (err) {
      setActionError(`Status não salvo: ${(err as Error).message}`);
      load();
    }
  }

  async function deleteLead(lead: Lead) {
    setToDelete(null);
    setActionError(null);
    try {
      await api(`/admin/leads/${lead.id}`, { method: 'DELETE' });
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      if (selected?.id === lead.id) setSelected(null);
    } catch (err) {
      setActionError(`Lead não excluído: ${(err as Error).message}`);
    }
  }

  const selCls = 'bg-[#f9f7f2] border border-navy/10 rounded-lg px-3 py-2.5 font-body text-sm text-navy focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/20 transition-all';

  return (
    <AdminShell navItems={ADMIN_NAV_ITEMS} activeId="leads" breadcrumbs={[{ label: 'Leads' }]}>
      {/* Panel overlay */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <DetailPanel lead={selected} onClose={() => setSelected(null)} onStatusChange={changeStatus} onDelete={setToDelete} />
        </>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir este lead?"
        message={toDelete ? `O contato de ${toDelete.name} (${toDelete.email}) será removido definitivamente.` : ''}
        confirmLabel="Excluir"
        onConfirm={() => { if (toDelete) deleteLead(toDelete); }}
        onCancel={() => setToDelete(null)}
      />

      {/* Page header */}
      <div className="-mx-4 md:-mx-10 -mt-10 px-4 md:px-8 pt-8 pb-6 mb-8"
        style={{ background: '#f9f7f2', borderBottom: '1px solid rgba(16,28,45,0.07)' }}>
        <h2 className="font-display text-3xl font-bold mb-1" style={{ color: NAVY }}>Leads</h2>
        <p className="font-body text-sm" style={{ color: `${NAVY}70` }}>Pedidos de reserva e contatos enviados pelo site</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Novos" value={counts.new} accent />
        <StatCard label="Respondidos" value={counts.contacted} />
        <StatCard label="Encerrados" value={counts.closed} />
      </div>

      {actionError && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-lg font-body text-sm flex items-center justify-between gap-3"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {actionError}
          <button onClick={() => setActionError(null)} aria-label="Fechar"><X size={14} /></button>
        </div>
      )}

      {loadError ? (
        <div className="bg-white rounded-xl shadow-sm flex flex-col items-center justify-center py-20"
          style={{ border: '1px solid rgba(16,28,45,0.05)' }}>
          <Inbox size={36} className="mb-4" style={{ color: `${NAVY}25` }} />
          <p className="font-body text-sm font-semibold mb-1" style={{ color: NAVY }}>Não foi possível carregar os leads</p>
          <p className="font-body text-xs text-center max-w-xs mb-4" style={{ color: `${NAVY}50` }}>{loadError}</p>
          <button onClick={load} className="font-body text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {/* Filter row */}
          <div className="flex flex-wrap gap-3 mb-5 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: `${NAVY}50` }} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar por nome, e-mail, telefone, apartamento, mensagem…"
                className={`${selCls} pl-9 w-full`} />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as '' | LeadStatus); setPage(1); }} className={selCls}>
              <option value="">Todos os status</option>
              <option value="new">Novo</option>
              <option value="contacted">Respondido</option>
              <option value="closed">Encerrado</option>
            </select>
            {(search || filterStatus) && (
              <button onClick={() => { setSearch(''); setFilterStatus(''); setPage(1); }}
                className="flex items-center gap-1.5 font-body text-xs px-3 py-2.5 rounded-lg border transition-colors hover:bg-red-50"
                style={{ borderColor: `${NAVY}20`, color: `${NAVY}70` }}>
                <X size={12} /> Limpar
              </button>
            )}
          </div>

          <p className="font-body text-xs mb-4" style={{ color: `${NAVY}50` }}>
            {filtered.length} de {leads.length} leads
          </p>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid rgba(16,28,45,0.05)' }}>
            {loading ? (
              <div className="divide-y divide-[#101c2d]/[0.06]">
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
                <p className="font-body text-sm" style={{ color: `${NAVY}50` }}>Nenhum lead encontrado.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="hidden md:grid grid-cols-[1fr_140px_160px_100px_40px] gap-4 items-center px-6 py-3 border-b"
                  style={{ borderColor: `${NAVY}08`, background: '#fafaf9' }}>
                  {['Nome', 'Datas', 'Assunto', 'Status', ''].map((h) => (
                    <span key={h} className="font-body text-[10px] font-bold uppercase tracking-widest" style={{ color: `${NAVY}50` }}>{h}</span>
                  ))}
                </div>

                <div className="divide-y divide-[#101c2d]/[0.06]">
                  {pageLeads.map((l) => {
                    const nights = nightsBetween(l.checkIn, l.checkOut);
                    return (
                      <button key={l.id} onClick={() => setSelected(l)}
                        className="hidden md:grid w-full grid-cols-[1fr_140px_160px_100px_40px] gap-4 items-center px-6 py-4 text-left hover:bg-gray-50/70 transition-colors">
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold truncate" style={{ color: NAVY }}>{l.name}</p>
                          <p className="font-body text-xs truncate" style={{ color: `${NAVY}50` }}>{l.email}</p>
                        </div>
                        <div>
                          {l.checkIn ? (
                            <>
                              <p className="font-body text-xs" style={{ color: NAVY }}>
                                {l.checkIn} → {l.checkOut ?? '?'}
                              </p>
                              {nights != null && (
                                <p className="font-body text-[10px]" style={{ color: `${NAVY}50` }}>{nights} {nights === 1 ? 'noite' : 'noites'}</p>
                              )}
                            </>
                          ) : (
                            <p className="font-body text-[10px]" style={{ color: `${NAVY}40` }}>
                              Recebido em {new Date(l.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </p>
                          )}
                        </div>
                        <p className="font-body text-xs truncate" style={{ color: NAVY }}>{l.propertyName || '—'}</p>
                        <StatusBadge status={l.status} />
                        <ChevronRight size={14} style={{ color: `${NAVY}30` }} />
                      </button>
                    );
                  })}

                  {/* Mobile */}
                  {pageLeads.map((l) => (
                    <button key={`m-${l.id}`} onClick={() => setSelected(l)}
                      className="md:hidden w-full px-4 py-4 text-left flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold" style={{ color: NAVY }}>{l.name}</p>
                        <p className="font-body text-xs mb-1" style={{ color: `${NAVY}50` }}>{l.email}</p>
                        {l.propertyName && <p className="font-body text-xs" style={{ color: `${NAVY}60` }}>{l.propertyName}</p>}
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

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}
                className="font-body text-[11px] uppercase tracking-widest disabled:opacity-30" style={{ color: `${NAVY}50` }}>
                ← Anterior
              </button>
              <span className="font-body text-xs" style={{ color: `${NAVY}50` }}>Página {pageSafe} de {pageCount}</span>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={pageSafe === pageCount}
                className="font-body text-[11px] uppercase tracking-widest disabled:opacity-30" style={{ color: `${NAVY}50` }}>
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

// ── Export ────────────────────────────────────────────────────────────
export default function AdminLeads() {
  return <LeadsPage />;
}
