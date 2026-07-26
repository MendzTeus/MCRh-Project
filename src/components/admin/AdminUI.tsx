import { useEffect, useRef, type ReactNode } from 'react';

// Shared admin design-system primitives (Phase 10). Not yet wired into
// Admin.tsx/AdminApartment.tsx — those keep their existing local Btn/Status/etc.
// until the Phase 11-15 redesigns replace them, to avoid touching live admin
// screens twice. New admin UI work should import from here instead of
// redefining these patterns locally again.

export function AdminButton({
  children, onClick, variant = 'default', disabled, type,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'gold';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const c = variant === 'gold' ? 'var(--color-admin-gold)' : 'var(--color-admin-navy)';
  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
      style={{ border: `1px solid ${c}`, color: c, background: 'transparent' }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c; }}
    >
      {children}
    </button>
  );
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-outline-variant/30 bg-surface-container-lowest p-5 ${className}`}>
      {children}
    </div>
  );
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return <p className="font-body text-on-surface-variant" role="status" aria-live="polite">{label}</p>;
}

export function EmptyState({ label }: { label: string }) {
  return <p className="font-body text-on-surface-variant/60">{label}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="font-body text-sm" role="alert" style={{ color: '#ba1a1a' }}>
      {message}
    </div>
  );
}

// Uses --color-admin-gold-text (not the raw accent) so "saved"/"idle" status
// text meets WCAG AA contrast on the light admin background — the raw
// accent gold is only 2.46:1 against the surface color, below the 4.5:1
// minimum for normal-size text.
export function SaveStatus({ status, error }: { status: 'idle' | 'saving' | 'saved' | 'error'; error?: string }) {
  if (status === 'idle') return null;
  return (
    <span
      className="font-body text-[10px] uppercase tracking-[0.15em]"
      style={{ color: status === 'error' ? '#ba1a1a' : 'var(--color-admin-gold-text)' }}
      title={status === 'error' && error ? error : undefined}
    >
      {status === 'saving' ? 'Salvando…' : status === 'saved' ? '✓ Salvo' : `Erro: ${error || 'ao salvar'}`}
    </span>
  );
}

// Replaces ad-hoc window.confirm()/confirm() calls scattered through the admin
// pages with a focus-trapped, labelled dialog — confirm() blocks the whole
// tab and gives assistive tech nothing to announce, which Phase 9's UX audit
// flagged as an accessibility gap.
export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Element focused before the dialog opened — restored on close so keyboard
  // users land back where they were, rather than at the top of the page.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      confirmRef.current?.focus();
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      // Tab-cycle focus trap: keep focus looping within the dialog's
      // focusable elements instead of escaping to the page behind it.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !dialogRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-message"
        className="bg-surface-container-lowest border border-outline-variant/30 p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-confirm-title" className="font-display text-headline-sm text-on-surface mb-2">{title}</h2>
        <p id="admin-confirm-message" className="font-body text-sm text-on-surface-variant mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <AdminButton onClick={onCancel}>Cancelar</AdminButton>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] text-white min-h-[44px]"
            style={{ background: '#ba1a1a' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
