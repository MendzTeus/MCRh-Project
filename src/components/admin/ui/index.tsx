// Admin v2 UI kit — small, consistent building blocks for every admin screen.
// Tokens live in src/index.css (--color-ad-*, --font-ui, --shadow-ad-*).
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap';

/** Loads the admin UI font once (only on admin screens, never on the public site). */
export function useAdminFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BUTTON: Record<ButtonVariant, string> = {
  primary: 'bg-ad-ink text-white hover:bg-[#243043] shadow-sm',
  secondary: 'bg-ad-panel text-ad-ink border border-ad-line-strong hover:border-ad-ink/40 hover:bg-ad-sunken/60',
  ghost: 'text-ad-muted hover:text-ad-ink hover:bg-ad-sunken',
  danger: 'bg-ad-panel text-ad-danger border border-ad-danger/30 hover:bg-ad-danger-soft',
};

export function Button({
  variant = 'secondary', size = 'md', busy, icon, children, className, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: 'sm' | 'md'; busy?: boolean; icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background,border-color,color,transform] duration-200',
        'active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ad-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ad-bg',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
        BUTTON[variant],
        className,
      )}
    >
      {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cx('bg-ad-panel rounded-2xl border border-ad-line/70 shadow-[var(--shadow-ad-card)]', padded && 'p-6', className)}>
      {children}
    </div>
  );
}

export function SectionHeading({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ad-ink">{title}</h2>
        {description && <p className="text-sm text-ad-muted mt-0.5 max-w-[65ch]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';
const TONE: Record<Tone, string> = {
  neutral: 'bg-ad-sunken text-ad-muted',
  accent: 'bg-ad-accent-soft text-ad-accent',
  ok: 'bg-ad-ok-soft text-ad-ok',
  warn: 'bg-ad-warn-soft text-ad-warn',
  danger: 'bg-ad-danger-soft text-ad-danger',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', TONE[tone], className)}>{children}</span>;
}

/** Inline banner for warnings, errors and confirmations. */
export function Notice({ tone = 'neutral', title, children, actions }: { tone?: Tone; title?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2', TONE[tone])}>
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
export function SaveIndicator({ state, error }: { state: SaveState; error?: string }) {
  if (state === 'idle') return null;
  return (
    <span role={state === 'error' ? 'alert' : 'status'} className={cx('inline-flex items-center gap-1.5 text-[13px]', state === 'error' ? 'text-ad-danger' : 'text-ad-muted')}>
      {state === 'saving' && <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Salvando…</>}
      {state === 'saved' && '✓ Tudo salvo'}
      {state === 'error' && `Não foi salvo: ${error || 'erro'}`}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ad-line-strong bg-ad-panel/60 px-6 py-12 text-center">
      <p className="text-[15px] font-semibold text-ad-ink">{title}</p>
      {children && <div className="text-sm text-ad-muted mt-1 max-w-[52ch] mx-auto">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-ad-sunken', className)} />;
}

export const fieldLabel = 'block text-[13px] font-medium text-ad-ink mb-1.5';
export const fieldInput = 'w-full h-10 rounded-lg border border-ad-line-strong bg-ad-panel px-3 text-sm text-ad-ink placeholder:text-ad-faint transition-colors focus:outline-none focus:border-ad-ink/50 focus:ring-2 focus:ring-ad-accent/25';
