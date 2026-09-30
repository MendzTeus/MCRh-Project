import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Images, FileEdit, Building, Star,
  CalendarCheck, UserSearch, Receipt, Menu, X, LogOut, ExternalLink, Image,
} from 'lucide-react';
import type { AdminNavItem } from './adminNavigation';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminFont } from './ui';

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard:    LayoutDashboard,
  leads:        UserSearch,
  availability: CalendarCheck,
  apartments:   Building2,
  photos:       Images,
  properties:   Building,
  reviews:      Star,
  content:      FileEdit,
  images:       Image,
  collector:    Receipt,
};

function NavList({ navItems, activeId, onItemClick }: {
  navItems: readonly AdminNavItem[];
  activeId: string;
  onItemClick?: () => void;
}) {
  const navigate = useNavigate();
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onNavKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? (i + 1) % navItems.length : (i - 1 + navItems.length) % navItems.length;
    navRefs.current[next]?.focus();
  };

  return (
    <ul className="flex flex-col gap-0.5 px-3" role="list">
      {navItems.map((item, i) => {
        const Icon = NAV_ICONS[item.id] ?? LayoutDashboard;
        const active = activeId === item.id;
        const startsGroup = i === 0 || navItems[i - 1].group !== item.group;
        return (
          <li key={item.id}>
            {startsGroup && (
              <p className={`px-3 ${i === 0 ? 'pt-1' : 'pt-6'} pb-2 text-xs font-medium text-white/40`}>
                {item.group}
              </p>
            )}
            <button
              ref={(el) => { navRefs.current[i] = el; }}
              onClick={() => { navigate(item.path); onItemClick?.(); }}
              onKeyDown={(e) => onNavKeyDown(e, i)}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-left transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-admin-gold)]/60
                ${active ? 'bg-white/10 text-white font-medium' : 'text-white/65 hover:text-white hover:bg-white/5'}`}
            >
              <Icon size={17} strokeWidth={1.75} aria-hidden="true" style={{ color: active ? 'var(--color-admin-gold)' : undefined }} />
              <span>{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarFooter() {
  const { logout } = useAdminAuth();
  return (
    <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
      <a href="/" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-body text-xs text-white/60 hover:text-white transition-colors">
        Ver o site <ExternalLink size={12} aria-hidden="true" />
      </a>
      <button onClick={logout}
        className="inline-flex items-center gap-1.5 font-body text-xs text-white/60 hover:text-white transition-colors">
        <LogOut size={13} aria-hidden="true" /> Sair
      </button>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: 'var(--color-admin-gold)' }}>
        <Building2 size={18} className="text-white" aria-hidden="true" />
      </div>
      <div>
        <span className="font-display text-xl font-bold leading-tight" style={{ color: 'var(--color-admin-gold)' }}>MCRh</span>
        <span className="font-display text-xl font-bold leading-tight text-white ml-1.5">Admin</span>
        <p className="text-white/45 text-xs mt-0.5">Gestão do site</p>
      </div>
    </div>
  );
}

export function AdminShell({
  navItems, activeId, breadcrumbs, rightSlot, children,
}: {
  navItems: readonly AdminNavItem[];
  activeId: string;
  breadcrumbs: { label: string; onClick?: () => void }[];
  /** Page-specific actions/info shown on the right of the top bar. */
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useAdminFont();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="admin-root min-h-screen bg-ad-bg md:flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:fixed md:left-0 md:top-0 md:h-screen text-white shadow-xl z-50"
        style={{ background: 'var(--color-admin-navy)' }}
      >
        <div className="px-6 py-6 border-b border-white/10"><Logo /></div>
        <nav aria-label="Navegação do admin" className="flex-1 overflow-y-auto py-4">
          <NavList navItems={navItems} activeId={activeId} />
        </nav>
        <SidebarFooter />
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
              <Logo />
              <button onClick={() => setDrawerOpen(false)} aria-label="Fechar menu" className="text-white/60">
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Navegação do admin (celular)" className="flex-1 py-4 overflow-y-auto">
              <NavList navItems={navItems} activeId={activeId} onItemClick={() => setDrawerOpen(false)} />
            </nav>
            <SidebarFooter />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 md:ml-64">
        <header className="sticky top-0 z-20 bg-ad-bg/85 backdrop-blur border-b border-ad-line">
          <div className="flex items-center h-14 px-4 md:px-8 gap-4 max-w-[1320px] mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setDrawerOpen(true)} aria-label="Abrir menu" className="md:hidden text-ad-muted">
                <Menu size={22} aria-hidden="true" />
              </button>
              <nav aria-label="Caminho" className="min-w-0">
                <ol className="flex items-center gap-2">
                  {breadcrumbs.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 min-w-0">
                      {i > 0 && <span className="text-ad-faint">/</span>}
                      {b.onClick ? (
                        <button onClick={b.onClick}
                          className="text-sm text-ad-muted hover:text-ad-ink transition-colors whitespace-nowrap">
                          {b.label}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-ad-ink truncate">{b.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            {rightSlot && <div className="flex items-center gap-3 ml-auto shrink-0">{rightSlot}</div>}
          </div>
        </header>

        <main className="max-w-[1320px] mx-auto px-4 md:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

/** Standard page heading used by every admin section. */
export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-[32px] leading-tight font-semibold tracking-[-0.01em] text-ad-ink">{title}</h1>
        {description && <p className="text-[15px] mt-1.5 text-ad-muted max-w-[65ch]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Loading / error state shared by admin sections. */
export function AdminLoadState({ loaded, error, onRetry, children }: {
  loaded: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (!loaded) return <p className="font-body text-sm text-on-surface-variant">Carregando…</p>;
  if (error) {
    return (
      <div role="alert" className="px-4 py-3 rounded-lg font-body text-sm flex items-center justify-between gap-3"
        style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
        Não foi possível carregar: {error}
        {onRetry && <button onClick={onRetry} className="font-semibold underline">Tentar de novo</button>}
      </div>
    );
  }
  return <>{children}</>;
}
