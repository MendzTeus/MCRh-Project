import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Images, FileEdit, Building, Star,
  CalendarCheck, UserSearch, Receipt, Menu, X, User,
} from 'lucide-react';
import type { AdminNavItem } from './adminNavigation';

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard:    LayoutDashboard,
  apartments:   Building2,
  photos:       Images,
  images:       Images,
  content:      FileEdit,
  properties:   Building,
  reviews:      Star,
  availability: CalendarCheck,
  leads:        UserSearch,
  collector:    Receipt,
};

export function AdminShell({
  navItems, activeId, breadcrumbs, rightSlot, children,
}: {
  navItems: readonly AdminNavItem[];
  activeId: string;
  breadcrumbs: { label: string; onClick?: () => void }[];
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
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
              onClick={() => { navigate(item.path); onItemClick?.(); }}
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
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:fixed md:left-0 md:top-0 md:h-screen text-white shadow-xl z-50"
        style={{ background: 'var(--color-admin-navy)' }}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <div
            className="w-9 h-9 rounded flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-admin-gold)' }}
          >
            <Building2 size={18} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="font-display text-xl font-bold leading-tight" style={{ color: 'var(--color-admin-gold)' }}>MCRh</span>
            <span className="font-display text-xl font-bold leading-tight text-white ml-1.5">Admin</span>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.18em] font-medium mt-0.5">Property Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Navegação do admin" className="flex-1 overflow-y-auto py-4">
          <NavList />
        </nav>

        {/* User section */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(197,160,89,0.2)' }}
          >
            <User size={15} style={{ color: 'var(--color-admin-gold)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold leading-tight truncate">Admin User</p>
            <p className="text-white/40 text-[10px] leading-tight truncate">MCRh Admin</p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navegação do admin"
            className="absolute left-0 top-0 h-full w-64 text-white flex flex-col"
            style={{ background: 'var(--color-admin-navy)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold" style={{ color: 'var(--color-admin-gold)' }}>MCRh</span>
                <span className="font-display text-xl font-bold text-white">Admin</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} aria-label="Fechar menu" className="text-white/60">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navegação do admin (móvel)" className="flex-1 py-4 overflow-y-auto">
              <NavList onItemClick={() => setDrawerOpen(false)} />
            </nav>
            <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.2)' }}>
                <User size={15} style={{ color: 'var(--color-admin-gold)' }} />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Admin User</p>
                <p className="text-white/40 text-[10px]">MCRh Admin</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 md:ml-64">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 text-white shadow-sm"
          style={{ background: 'var(--color-admin-navy)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center h-16 px-4 md:px-6 gap-4">
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0 shrink-0">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu"
                className="md:hidden text-white/70"
              >
                <Menu size={22} aria-hidden="true" />
              </button>
              <nav aria-label="Breadcrumb" className="hidden md:block min-w-0">
                <ol className="flex items-center gap-2" style={{ scrollbarWidth: 'none' }}>
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

            {/* Right: label + avatar + contextual actions */}
            <div className="flex items-center gap-3 ml-auto shrink-0">
              <span className="hidden lg:block font-body text-xs text-white/50">Admin Console</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                <User size={15} style={{ color: 'rgba(255,255,255,0.7)' }} />
              </div>
              {rightSlot && <div className="flex items-center gap-2 border-l border-white/10 pl-3">{rightSlot}</div>}
            </div>
          </div>
        </header>

        <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-10">{children}</main>
      </div>
    </div>
  );
}
