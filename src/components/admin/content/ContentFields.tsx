import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useUnsavedChangesGuard } from '../../../hooks/useAdminApi';
import { SITE_DEFAULTS, type ContentFieldDef, type ListColumn } from './contentSchema';

// Shared look for admin form controls (same tokens the rest of the admin uses).
export const labelClass = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
export const inputClass = 'w-full bg-white border border-outline-variant/50 rounded-md px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/30 transition-colors';

export type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

/**
 * Persists one SiteContent key. `value === undefined` removes the override so
 * the site shows its built-in default again.
 */
export type SaveContent = (key: string, value: unknown | undefined) => Promise<void>;

export function SaveStatus({ state }: { state: SaveState }) {
  if (state.kind === 'idle') return null;
  const color = state.kind === 'error' ? '#b91c1c' : '#826927';
  return (
    <span role={state.kind === 'error' ? 'alert' : 'status'} className="font-body text-[10px] uppercase tracking-[0.12em]" style={{ color }}>
      {state.kind === 'saving' && 'Salvando…'}
      {state.kind === 'saved' && '✓ Salvo'}
      {state.kind === 'error' && `Erro: ${state.message}`}
    </span>
  );
}

function OriginBadge({ custom }: { custom: boolean }) {
  return custom ? (
    <span className="font-body text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded" style={{ background: '#C5A05922', color: '#826927' }}>
      Personalizado
    </span>
  ) : (
    <span className="font-body text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant/70">
      Padrão do site
    </span>
  );
}

function useSaveState() {
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = async (task: () => Promise<void>) => {
    clearTimeout(timer.current);
    setState({ kind: 'saving' });
    try {
      await task();
      setState({ kind: 'saved' });
      timer.current = setTimeout(() => setState({ kind: 'idle' }), 1800);
      return true;
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message || 'falha ao salvar' });
      return false;
    }
  };
  return [state, run] as const;
}

function FieldHeader({ label, custom, state, onRestore }: { label: string; custom: boolean; state: SaveState; onRestore: () => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-1.5">
      <label className="font-body text-[11px] font-semibold text-on-surface">{label}</label>
      <OriginBadge custom={custom} />
      {custom && (
        <button type="button" onClick={onRestore}
          className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/70 hover:text-[#826927] underline underline-offset-2">
          Restaurar padrão
        </button>
      )}
      <span className="ml-auto"><SaveStatus state={state} /></span>
    </div>
  );
}

/** Single-line or multi-line text. Shows exactly what the site shows today. */
export function ContentTextField({ def, saved, onSave }: {
  def: Extract<ContentFieldDef, { kind: 'text' | 'textarea' }>;
  saved: unknown;
  onSave: SaveContent;
}) {
  const fallback = typeof SITE_DEFAULTS[def.key] === 'string' ? (SITE_DEFAULTS[def.key] as string) : '';
  // Same rule as the public text() helper: empty/non-string → built-in default.
  const custom = typeof saved === 'string' && saved.length > 0;
  const effective = custom ? (saved as string) : fallback;
  const [draft, setDraft] = useState(effective);
  const focused = useRef(false);
  const [state, run] = useSaveState();
  const dirty = draft !== effective;
  useUnsavedChangesGuard(dirty);

  // Follow changes of the saved value (a save landing, a restore) unless the
  // user is typing. A failed save leaves the typed text in place.
  useEffect(() => { if (!focused.current) setDraft(effective); }, [effective]);

  const commit = () => {
    focused.current = false;
    if (!dirty) return;
    const next = draft.trim() === '' || draft === fallback ? undefined : draft;
    run(() => onSave(def.key, next));
  };
  const restore = () => { setDraft(fallback); run(() => onSave(def.key, undefined)); };

  return (
    <div>
      <FieldHeader label={def.label} custom={custom} state={state} onRestore={restore} />
      {def.kind === 'textarea' ? (
        <textarea value={draft} rows={Math.min(8, Math.max(3, Math.ceil(draft.length / 90)))}
          onFocus={() => { focused.current = true; }} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          className={`${inputClass} resize-y leading-relaxed`} />
      ) : (
        <input value={draft} onFocus={() => { focused.current = true; }} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className={inputClass} />
      )}
      {def.hint && <p className="font-body text-[11px] text-on-surface-variant/60 mt-1">{def.hint}</p>}
      {dirty && <p className="font-body text-[11px] text-on-surface-variant/60 mt-1">Alteração não salva — clique fora do campo para salvar. Deixe vazio para voltar ao padrão.</p>}
    </div>
  );
}

type Row = Record<string, string>;
const isBlankRow = (row: Row, columns: ListColumn[]) => columns.every((c) => !(row[c.key] || '').trim());
const sameRows = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Editable list of rows (stats, links, bullets…). Starts from what the site shows. */
export function ContentListField({ def, saved, onSave }: {
  def: Extract<ContentFieldDef, { kind: 'list' }>;
  saved: unknown;
  onSave: SaveContent;
}) {
  const fallback = (Array.isArray(SITE_DEFAULTS[def.key]) ? SITE_DEFAULTS[def.key] : []) as Row[];
  // Same rule as the public list() helper: any saved array wins, even empty.
  const custom = Array.isArray(saved);
  const effective = (custom ? saved : fallback) as Row[];
  const [rows, setRows] = useState<Row[]>(effective);
  const editing = useRef(false);
  const [state, run] = useSaveState();
  const cleaned = rows.filter((row) => !isBlankRow(row, def.columns));
  useUnsavedChangesGuard(!sameRows(cleaned, effective));

  const effectiveJson = JSON.stringify(effective);
  useEffect(() => { if (!editing.current) setRows(effective); }, [effectiveJson]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Row[]) => {
    editing.current = false;
    const cleanedNext = next.filter((row) => !isBlankRow(row, def.columns));
    if (sameRows(cleanedNext, effective)) return;
    run(() => onSave(def.key, sameRows(cleanedNext, fallback) ? undefined : cleanedNext));
  };
  const restore = () => { setRows(fallback); run(() => onSave(def.key, undefined)); };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    commit(next);
  };

  return (
    <div>
      <FieldHeader label={def.label} custom={custom} state={state} onRestore={restore} />
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex flex-col pt-1.5">
              <button type="button" aria-label="Mover para cima" disabled={i === 0} onClick={() => move(i, -1)}
                className="text-[10px] leading-none text-on-surface-variant/60 hover:text-[#826927] disabled:opacity-20">▲</button>
              <button type="button" aria-label="Mover para baixo" disabled={i === rows.length - 1} onClick={() => move(i, 1)}
                className="text-[10px] leading-none text-on-surface-variant/60 hover:text-[#826927] disabled:opacity-20">▼</button>
            </div>
            {def.columns.map((c) => (
              <input key={c.key} value={row[c.key] ?? ''} placeholder={c.label} aria-label={c.label}
                style={{ flex: c.wide ? 3 : 1 }}
                onFocus={() => { editing.current = true; }}
                onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                onBlur={(e) => {
                  // Moving between columns of the same row isn't "done editing".
                  if (e.relatedTarget && e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) return;
                  commit(rows);
                }}
                className={inputClass} />
            ))}
            <button type="button" aria-label="Remover" onClick={() => { const next = rows.filter((_, j) => j !== i); setRows(next); commit(next); }}
              className="px-2 pt-2 text-on-surface-variant/50 hover:text-red-600 text-sm">✕</button>
          </div>
        ))}
        <button type="button"
          onClick={() => { editing.current = true; setRows([...rows, Object.fromEntries(def.columns.map((c) => [c.key, '']))]); }}
          className="font-body text-[10px] uppercase tracking-[0.15em] text-[#826927] mt-1">
          + Adicionar item
        </button>
      </div>
      {custom && effective.length === 0 && (
        <p className="font-body text-[11px] text-amber-700 mt-1">Lista vazia: esta parte do site fica sem itens. Use “Restaurar padrão” para voltar aos itens originais.</p>
      )}
      {def.hint && <p className="font-body text-[11px] text-on-surface-variant/60 mt-1">{def.hint}</p>}
    </div>
  );
}

export function ContentField({ def, content, onSave }: { def: ContentFieldDef; content: Record<string, unknown>; onSave: SaveContent }) {
  return def.kind === 'list'
    ? <ContentListField def={def} saved={content[def.key]} onSave={onSave} />
    : <ContentTextField def={def} saved={content[def.key]} onSave={onSave} />;
}

export function FieldGroup({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-outline-variant/30 rounded-xl shadow-sm p-5 space-y-5">
      <div>
        <p className="font-body text-label-caps tracking-widest uppercase text-xs text-[#826927]">{title}</p>
        {hint && <p className="font-body text-[11px] text-on-surface-variant/70 mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
