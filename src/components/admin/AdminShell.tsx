import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

// Phase 11 admin shell: desktop sidebar + sticky header w/ breadcrumbs, mobile
// drawer nav, active-route highlighting and roving-tabindex keyboard nav.
// Used by both Admin.tsx (top-level section tabs) and AdminApartment.tsx
// (per-unit editor tabs, with a breadcrumb back to Admin.tsx).

export type ShellNavItem = { id: string; label: string; onClick: () => void };

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
    <ul className="flex flex-col gap-0.5" role="list">
      {navItems.map((item, i) => (
        <li key={item.id}>
          <button
            ref={(el) => { navRefs.current[i] = el; }}
            onClick={() => { item.onClick(); onItemClick?.(); }}
            onKeyDown={(e) => onNavKeyDown(e, i)}
            aria-current={activeId === item.id ? 'page' : undefined}
            className="w-full text-left px-4 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] transition-colors border-l-2"
            style={{
              color: activeId === item.id ? 'var(--color-admin-gold)' : 'rgba(255,255,255,0.6)',
              borderColor: activeId === item.id ? 'var(--color-admin-gold)' : 'transparent',
              background: activeId === item.id ? 'rgba(197,160,89,0.08)' : 'transparent',
            }}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-surface md:flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:sticky md:top-0 md:h-screen text-white py-6"
        style={{ background: 'var(--color-admin-navy)', borderRight: '1px solid rgba(197,160,89,0.4)' }}
      >
        <span className="font-display text-2xl tracking-tight px-4 mb-6">MCRh</span>
        <nav aria-label="Navegação do admin">
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
            <div className="flex items-center justify-between px-4 mb-6">
              <span className="font-display text-2xl tracking-tight">MCRh</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="text-white/60 text-2xl leading-none px-2"
              >
                ×
              </button>
            </div>
            <nav aria-label="Navegação do admin (móvel)">
              <NavList onItemClick={() => setDrawerOpen(false)} />
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header
          className="sticky top-0 z-20 text-white"
          style={{ background: 'var(--color-admin-navy)', borderBottom: '1px solid rgba(197,160,89,0.4)' }}
        >
          <div className="flex items-center justify-between gap-4 h-16 px-4 md:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu"
                className="md:hidden shrink-0 text-white/70 text-xl leading-none px-1"
              >
                ☰
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
