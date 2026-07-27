import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  LayoutDashboard, Building2, Images, FileEdit, Building, Star,
  CalendarCheck, UserSearch, Receipt, Menu, X,
} from 'lucide-react';

// Admin shell restyled to match the approved Stitch "MCRh Admin Redesign"
// layout: a fixed 16rem navy sidebar with icon + label nav items and a
// gold left-border active indicator, and a fixed navy top bar. Mobile drawer
// nav, active-route highlighting and roving-tabindex keyboard nav preserved
// from the previous shell. Used by both Admin.tsx (top-level section tabs)
// and AdminApartment.tsx (per-unit editor tabs, with a breadcrumb back to
// Admin.tsx).

export type ShellNavItem = { id: string; label: string; onClick: () => void };

// Maps admin section ids to the Material-Symbols icon Stitch used for that
// nav entry (dashboard, apartment, photo_library, edit_note, business, star,
// event_available, person_search, receipt_long) — translated to the
// lucide-react equivalents already used elsewhere in this project.
const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  apartments: Building2,
  photos: Images,
  images: Images,
  content: FileEdit,
  properties: Building,
  reviews: Star,
  availability: CalendarCheck,
  leads: UserSearch,
  collector: Receipt,
};

export function AdminShell({
  navItems, activeId, breadcrumbs, rightSlot, children,
}: {
  navItems: ShellNavItem[];
  activeId: string;
  breadcrumbs: { label: string; onClick?: () => void }[];
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const onNavKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? (i + 1) % navItems.length : (i - 1 + navItems.length) % navItems.length;
    navRefs.current[next]?.focus();
  };

  const NavList = ({ onItemClick }: { onItemClick?: () => void }) => (
    <ul className="flex flex-col gap-1 px-4" role="list">
      {navItems.map((item, i) => {
        const Icon = NAV_ICONS[item.id] ?? LayoutDashboard;
        const active = activeId === item.id;
        return (
          <li key={item.id}>
            <button
              ref={(el) => { navRefs.current[i] = el; }}
              onClick={() => { item.onClick(); onItemClick?.(); }}
              onKeyDown={(e) => onNavKeyDown(e, i)}
              aria-current={active ? 'page' : undefined}
              className="w-full flex items-center gap-3 px-4 py-3 font-body text-sm font-medium tracking-wide transition-colors border-l-4"
              style={{
                color: active ? 'var(--color-admin-gold)' : 'rgba(255,255,255,0.7)',
                borderColor: active ? 'var(--color-admin-gold)' : 'transparent',
                background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
              }}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-surface md:flex">
      {/* Desktop sidebar — fixed 16rem navy rail matching the Stitch SideNavBar */}
      <aside
        className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:fixed md:left-0 md:top-0 md:h-screen text-white py-6 shadow-xl z-50"
        style={{ background: 'var(--color-admin-navy)' }}
      >
        <div className="px-6 mb-8 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-admin-gold)' }}
          >
            <Building2 size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold leading-none" style={{ color: 'var(--color-admin-gold)' }}>MCRh</span>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-medium mt-1">Property Management</p>
          </div>
        </div>
        <nav aria-label="Navegação do admin" className="flex-1 overflow-y-auto">
          <NavList />
        </nav>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navegação do admin"
            className="absolute left-0 top-0 h-full w-64 text-white py-6"
            style={{ background: 'var(--color-admin-navy)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 mb-8">
              <span className="font-display text-2xl font-bold" style={{ color: 'var(--color-admin-gold)' }}>MCRh</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="text-white/60 leading-none"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navegação do admin (móvel)">
              <NavList onItemClick={() => setDrawerOpen(false)} />
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 md:ml-64">
        {/* Top bar — fixed navy header matching the Stitch TopNavBar */}
        <header
          className="sticky top-0 z-20 text-white shadow-sm"
          style={{ background: 'var(--color-admin-navy)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between gap-4 h-16 px-4 md:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu"
                className="md:hidden shrink-0 text-white/70"
              >
                <Menu size={22} aria-hidden="true" />
              </button>
              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex items-center gap-2 min-w-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {breadcrumbs.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 shrink-0">
                      {i > 0 && <span className="text-white/30">/</span>}
                      {b.onClick ? (
                        <button
                          onClick={b.onClick}
                          className="font-body text-[11px] uppercase tracking-[0.12em] text-white/50 hover:text-white transition-colors"
                        >
                          {b.label}
                        </button>
                      ) : (
                        <span className="font-body text-[11px] uppercase tracking-[0.12em] text-white truncate">{b.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            {rightSlot && <div className="flex items-center gap-4 shrink-0">{rightSlot}</div>}
          </div>
        </header>

        <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">{children}</main>
      </div>
    </div>
  );
}
