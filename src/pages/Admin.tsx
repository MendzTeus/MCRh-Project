import { useState, useEffect, useCallback, useRef, type FormEvent, type ReactNode } from 'react';
import { getListingMedia, cleanListingTitle } from '../data/listingMedia';

// Quiet Luxury signature accent
const GOLD = '#C5A059';
const NAVY = '#101c2d';
const TOKEN_KEY = 'mcrh_admin_token';

// ── Types ───────────────────────────────────────────────────────────
type Photo = { id: string; url: string; alt: string | null; isPrimary: boolean; displayOrder: number };
type Unit = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  suppliedSpecs: string | null; postcode: string | null; airbnbUrl: string | null;
  description: string | null; visible: boolean; airbnbListed?: boolean; displayOrder: number; photos: Photo[];
};
type SiteData = { content: Record<string, unknown>; images: Record<string, { url: string; alt: string | null }> };

// Image slots the admin can override (friendly labels for the UI).
const IMAGE_SLOTS: { slot: string; label: string; page: string }[] = [
  { slot: 'home.hero', label: 'Foto de capa (hero)', page: 'Home' },
  { slot: 'design.hero', label: 'Hero', page: 'Design Services' },
  { slot: 'design.approach', label: 'Seção "Our Approach"', page: 'Design Services' },
  { slot: 'management.hero', label: 'Hero', page: 'Management Services' },
  { slot: 'about.hero', label: 'Hero', page: 'About' },
];

// ── API helper ──────────────────────────────────────────────────────
function useApi(token: string | null, onUnauthorized: () => void) {
  return useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`/api${path}`, {
      ...opts,
      headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
    });
    if (res.status === 401) { onUnauthorized(); throw new Error('Unauthorized'); }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    return res.json();
  }, [token, onUnauthorized]);
}

function fileToBase64(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], type: file.type });
    reader.readAsDataURL(file);
  });
}

// ── Shared primitives (Quiet Luxury) ────────────────────────────────
const label = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
const field = 'w-full bg-transparent border-b border-outline-variant/50 py-1.5 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors';

function Btn({ children, onClick, gold, disabled, type }: { children: ReactNode; onClick?: () => void; gold?: boolean; disabled?: boolean; type?: 'button' | 'submit' }) {
  const c = gold ? GOLD : '#101c2d';
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      className="px-6 py-2.5 font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
      style={{ border: `1px solid ${c}`, color: c, background: 'transparent' }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = c; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = c; }}>
      {children}
    </button>
  );
}

function Status({ s }: { s: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <span className="font-body text-[10px] uppercase tracking-[0.15em]" style={{ color: s === 'error' ? '#ba1a1a' : GOLD }}>
      {s === 'saving' && 'Salvando…'}{s === 'saved' && '✓ Salvo'}{s === 'error' && 'Erro'}
    </span>
  );
}

// ── Login ───────────────────────────────────────────────────────────
function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no login');
      onLogin(data.token);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: NAVY }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-surface p-12" style={{ borderTop: `2px solid ${GOLD}` }}>
        <div className="font-display text-4xl text-primary mb-1 tracking-tight">MCRh</div>
        <div className="font-body text-[11px] uppercase tracking-[0.2em] text-on-surface-variant mb-10">Painel de Administração</div>
        <label className={label}>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus className={`${field} mb-8`} />
        {error && <div className="font-body text-sm mb-6" style={{ color: '#ba1a1a' }}>{error}</div>}
        <Btn type="submit" gold disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Btn>
      </form>
    </div>
  );
}

// ── Photo tile ──────────────────────────────────────────────────────
function PhotoTile({ photo, onSetCover, onDelete }: { photo: Photo; onSetCover: () => void; onDelete: () => void }) {
  return (
    <div className="relative w-24 h-24 overflow-hidden shrink-0" style={{ border: photo.isPrimary ? `2px solid ${GOLD}` : '1px solid rgba(197,198,205,0.5)' }}>
      <img src={photo.url} alt={photo.alt || ''} className="w-full h-full object-cover" />
      {photo.isPrimary && <div className="absolute top-0 left-0 font-body text-[8px] uppercase tracking-widest text-white px-1.5 py-0.5" style={{ background: GOLD }}>Capa</div>}
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ background: 'rgba(16,28,45,0.75)' }}>
        {!photo.isPrimary && <button title="Definir como capa" onClick={onSetCover} className="flex-1 text-white text-xs py-1 hover:text-[#C5A059] transition-colors">★</button>}
        <button title="Excluir" onClick={onDelete} className="flex-1 text-white/80 text-xs py-1 hover:text-red-300 transition-colors">✕</button>
      </div>
    </div>
  );
}

// Move a slug to a target index within the featured list (for the order control).
function moveInArray(arr: string[], slug: string, toIndex: number): string[] {
  const from = arr.indexOf(slug);
  if (from === -1) return arr;
  const next = [...arr];
  next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, toIndex)), 0, slug);
  return next;
}

// ── Unit card ───────────────────────────────────────────────────────
function UnitCard({ unit, api, onChanged, featured, onSaveFeatured, displayTitles, onSaveDisplayTitle }: { unit: Unit; api: ReturnType<typeof useApi>; onChanged: () => void; featured: string[]; onSaveFeatured: (next: string[]) => void; displayTitles: Record<string, string>; onSaveDisplayTitle: (slug: string, value: string) => void }) {
  const isFeatured = featured.includes(unit.unitSlug);
  const featuredPos = featured.indexOf(unit.unitSlug); // 0-based
  // Original Airbnb title (from the scrape) + its auto-cleaned fallback for preview.
  const originalTitle = getListingMedia(unit.unitSlug)?.title || unit.unitName;
  const storedDisplayTitle = displayTitles[unit.unitSlug] || '';
  const [name, setName] = useState(unit.unitName);
  const [specs, setSpecs] = useState(unit.suppliedSpecs || '');
  const [airbnb, setAirbnb] = useState(unit.airbnbUrl || '');
  const [dispTitle, setDispTitle] = useState(storedDisplayTitle);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(unit.unitName); setSpecs(unit.suppliedSpecs || ''); setAirbnb(unit.airbnbUrl || ''); }, [unit]);
  useEffect(() => { setDispTitle(storedDisplayTitle); }, [storedDisplayTitle]);

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setStatus('saving');
    try { await api(`/admin/units/${unit.unitSlug}`, { method: 'PATCH', body: JSON.stringify(patch) }); setStatus('saved'); setTimeout(() => setStatus('idle'), 1500); onChanged(); }
    catch { setStatus('error'); }
  }, [api, unit.unitSlug, onChanged]);

  async function uploadPhoto(file: File) {
    setStatus('saving');
    const { base64, type } = await fileToBase64(file);
    try { await api(`/admin/units/${unit.unitSlug}/photos`, { method: 'POST', body: JSON.stringify({ dataBase64: base64, contentType: type, alt: unit.unitName }) }); setStatus('saved'); onChanged(); }
    catch { setStatus('error'); }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 p-5" style={{ opacity: unit.visible ? 1 : 0.55 }}>
      <div className="flex justify-between items-center mb-4">
        <span className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/70">{unit.unitSlug}</span>
        {unit.airbnbListed === false && (
          <span title="A verificação diária detectou que este anúncio está 'não listado' no Airbnb, por isso ele não aparece no site. Volta automaticamente quando você reativar no Airbnb."
            className="font-body text-[9px] uppercase tracking-[0.12em] text-red-600 border border-red-300 px-1.5 py-0.5">
            Não listado no Airbnb
          </span>
        )}
        <button type="button" onClick={() => save({ visible: !unit.visible })} aria-pressed={unit.visible}
          className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">
          <span>{unit.visible ? 'Visível' : 'Oculto'}</span>
          <span className="relative inline-block w-9 h-5 transition-colors" style={{ background: unit.visible ? GOLD : '#c5c6cd' }}>
            <span className="absolute top-0.5 w-4 h-4 bg-white transition-all" style={{ left: unit.visible ? 18 : 2 }} />
          </span>
        </button>
      </div>

      {/* Featured on homepage */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/20">
        <button type="button"
          onClick={() => onSaveFeatured(isFeatured ? featured.filter((s) => s !== unit.unitSlug) : [...featured, unit.unitSlug])}
          aria-pressed={isFeatured}
          className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.15em]"
          style={{ color: isFeatured ? GOLD : 'var(--on-surface-variant, #44474c)' }}>
          <span>{isFeatured ? '★ Em destaque' : '☆ Destaque na home'}</span>
          <span className="relative inline-block w-9 h-5 transition-colors" style={{ background: isFeatured ? GOLD : '#c5c6cd' }}>
            <span className="absolute top-0.5 w-4 h-4 bg-white transition-all" style={{ left: isFeatured ? 18 : 2 }} />
          </span>
        </button>
        {isFeatured && (
          <label className="flex items-center gap-2 font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/70">
            Ordem
            <input type="number" min={1} max={featured.length} value={featuredPos + 1}
              onChange={(e) => {
                const pos = Number(e.target.value);
                if (Number.isFinite(pos)) onSaveFeatured(moveInArray(featured, unit.unitSlug, pos - 1));
              }}
              className="w-14 bg-transparent border-b border-outline-variant/50 py-1 text-center font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059]" />
          </label>
        )}
      </div>

      <div className="grid gap-4 mb-5">
        <div><label className={label}>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== unit.unitName && save({ unitName: name })} className={`${field} font-display text-base`} /></div>
        <div>
          <label className={label}>Título de exibição no site <span className="text-on-surface-variant/40 normal-case tracking-normal">(opcional)</span></label>
          <input value={dispTitle} onChange={(e) => setDispTitle(e.target.value)}
            onBlur={() => { if (dispTitle.trim() !== storedDisplayTitle) onSaveDisplayTitle(unit.unitSlug, dispTitle.trim()); }}
            placeholder={cleanListingTitle(originalTitle) || originalTitle} className={field} />
          <p className="font-body text-[10px] text-on-surface-variant/60 mt-1.5 leading-relaxed">
            No site aparece: <span style={{ color: GOLD }}>{dispTitle.trim() || cleanListingTitle(originalTitle) || originalTitle}</span>
            <br />Original do Airbnb: <span className="text-on-surface-variant/50">{originalTitle}</span>
          </p>
        </div>
        <div><label className={label}>Specs</label>
          <input value={specs} onChange={(e) => setSpecs(e.target.value)} onBlur={() => specs !== (unit.suppliedSpecs || '') && save({ suppliedSpecs: specs })} placeholder="2BED 2BATH" className={field} /></div>
        <div><label className={label}>Link do Airbnb</label>
          <input value={airbnb} onChange={(e) => setAirbnb(e.target.value)} onBlur={() => airbnb !== (unit.airbnbUrl || '') && save({ airbnbUrl: airbnb })} className={field} /></div>
      </div>

      <label className={label}>Fotos</label>
      <div className="flex flex-wrap gap-2 items-center">
        {unit.photos.map((p) => (
          <div key={p.id} style={{ display: 'contents' }}>
            <PhotoTile photo={p}
              onSetCover={async () => { await api(`/admin/photos/${p.id}`, { method: 'PATCH', body: JSON.stringify({ isPrimary: true }) }); onChanged(); }}
              onDelete={async () => { if (confirm('Excluir esta foto?')) { await api(`/admin/photos/${p.id}`, { method: 'DELETE' }); onChanged(); } }}
            />
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} className="w-24 h-24 border border-dashed border-outline-variant/70 text-on-surface-variant/60 font-body text-[10px] uppercase tracking-widest hover:border-[#C5A059] hover:text-[#C5A059] transition-colors shrink-0">+ Foto</button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }} />
      </div>
      <div className="mt-3 h-4"><Status s={status} /></div>
    </div>
  );
}

// ── Images tab ──────────────────────────────────────────────────────
function ImagesTab({ site, api, onChanged }: { site: SiteData; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(slot: string, file: File) {
    setBusy(slot);
    const { base64, type } = await fileToBase64(file);
    try { await api(`/admin/images/${slot}`, { method: 'POST', body: JSON.stringify({ dataBase64: base64, contentType: type }) }); onChanged(); }
    finally { setBusy(null); }
  }

  return (
    <div className="max-w-3xl">
      <p className="font-body text-body-md text-on-surface-variant mb-8">Troque as imagens de capa das páginas. Sem uma imagem definida aqui, o site usa a imagem padrão.</p>
      <div className="divide-y divide-outline-variant/30 border-y border-outline-variant/30">
        {IMAGE_SLOTS.map((s) => {
          const current = site.images[s.slot];
          return (
            <div key={s.slot} className="flex items-center gap-6 py-6">
              <div className="w-40 h-24 bg-surface-container shrink-0 overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                {current ? <img src={current.url} alt="" className="w-full h-full object-cover" /> : <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/50">Padrão do site</span>}
              </div>
              <div className="flex-1">
                <div className="font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/70">{s.page}</div>
                <div className="font-display text-lg text-primary">{s.label}</div>
              </div>
              <div className="flex items-center gap-3">
                <Btn gold onClick={() => refs.current[s.slot]?.click()} disabled={busy === s.slot}>{busy === s.slot ? 'Enviando…' : current ? 'Trocar' : 'Enviar'}</Btn>
                {current && <Btn onClick={async () => { await api(`/admin/images/${s.slot}`, { method: 'DELETE' }); onChanged(); }}>Reverter</Btn>}
                <input ref={(el) => { refs.current[s.slot] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(s.slot, f); e.target.value = ''; }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Content tab ─────────────────────────────────────────────────────
function ContentTab({ site, api, onChanged }: { site: SiteData; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const save = useCallback((key: string, value: unknown) => api(`/admin/content/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }).then(onChanged), [api, onChanged]);

  function StringField({ k, title, textarea }: { k: string; title: string; textarea?: boolean }) {
    const [v, setV] = useState(String(site.content[k] ?? ''));
    const [s, setS] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const commit = () => { if (v !== String(site.content[k] ?? '')) { setS('saving'); save(k, v).then(() => { setS('saved'); setTimeout(() => setS('idle'), 1500); }).catch(() => setS('error')); } };
    return (
      <div>
        <div className="flex items-center justify-between"><label className={label}>{title}</label><Status s={s} /></div>
        {textarea
          ? <textarea value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} rows={3} className={`${field} resize-none`} />
          : <input value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} className={field} />}
      </div>
    );
  }

  function ListEditor<T extends Record<string, string>>({ k, title, cols, blank }: { k: string; title: string; cols: { key: keyof T; label: string; wide?: boolean }[]; blank: T }) {
    const [rows, setRows] = useState<T[]>(Array.isArray(site.content[k]) ? (site.content[k] as T[]) : []);
    const [s, setS] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const commit = (next: T[]) => { setRows(next); setS('saving'); save(k, next).then(() => { setS('saved'); setTimeout(() => setS('idle'), 1500); }).catch(() => setS('error')); };
    return (
      <div>
        <div className="flex items-center justify-between mb-2"><label className={label}>{title}</label><Status s={s} /></div>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-3 items-end">
              {cols.map((c) => (
                <div key={String(c.key)} style={{ flex: c.wide ? 3 : 1 }}>
                  <input value={row[c.key]} placeholder={c.label}
                    onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, [c.key]: e.target.value } : r))}
                    onBlur={() => commit(rows)} className={field} />
                </div>
              ))}
              <button onClick={() => commit(rows.filter((_, j) => j !== i))} className="text-on-surface-variant/50 hover:text-red-500 pb-1.5 text-sm">✕</button>
            </div>
          ))}
          <button onClick={() => setRows([...rows, { ...blank }])} className="font-body text-[10px] uppercase tracking-[0.15em] text-[#C5A059] mt-1">+ Adicionar</button>
        </div>
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mb-14">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-display text-headline-md text-primary whitespace-nowrap">{title}</h2>
        <div className="flex-1 h-px" style={{ background: `${GOLD}55` }} />
      </div>
      <div className="grid gap-6 max-w-2xl">{children}</div>
    </section>
  );

  return (
    <div className="max-w-3xl">
      <Section title="Home">
        <StringField k="home.hero.title" title="Título do hero" />
        <StringField k="home.hero.subtitle" title="Subtítulo do hero" textarea />
        <div className="grid grid-cols-2 gap-6">
          <StringField k="home.hero.ctaLabel" title="Texto do botão" />
          <StringField k="home.hero.ctaHref" title="Link do botão" />
        </div>
        <StringField k="home.map.title" title="Título da seção do mapa" />
        <ListEditor k="home.stats" title="Números / estatísticas" blank={{ value: '', label: '' }} cols={[{ key: 'value', label: 'Ex.: 30+' }, { key: 'label', label: 'Rótulo', wide: true }]} />
        <ListEditor k="home.testimonials" title="Depoimentos" blank={{ text: '', name: '', property: '' }} cols={[{ key: 'text', label: 'Depoimento', wide: true }, { key: 'name', label: 'Nome' }, { key: 'property', label: 'Propriedade' }]} />
      </Section>

      <Section title="Contato">
        <StringField k="contact.email" title="E-mail" />
        <StringField k="contact.phone" title="Telefone / WhatsApp" />
        <StringField k="contact.address" title="Endereço" textarea />
        <StringField k="contact.intro" title="Texto de introdução" textarea />
      </Section>

      <Section title="Rodapé">
        <ListEditor k="footer.links" title="Links do rodapé" blank={{ label: '', href: '' }} cols={[{ key: 'label', label: 'Texto' }, { key: 'href', label: 'Link (URL)', wide: true }]} />
      </Section>

      <Section title="Páginas de Serviço & Sobre">
        <StringField k="design.hero.title" title="Design — título" />
        <StringField k="design.hero.paragraph" title="Design — parágrafo" textarea />
        <StringField k="management.hero.title" title="Management — título" />
        <StringField k="management.hero.paragraph" title="Management — parágrafo" textarea />
        <StringField k="about.hero.title" title="About — título" />
      </Section>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
type Tab = 'apartments' | 'images' | 'content';

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [tab, setTab] = useState<Tab>('apartments');
  const [units, setUnits] = useState<Unit[]>([]);
  const [site, setSite] = useState<SiteData>({ content: {}, images: {} });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); setUnits([]); }, []);
  const api = useApi(token, logout);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([api('/admin/units'), api('/admin/site')]);
      setUnits(u.units); setSite(s);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { if (token) load(); }, [token, load]);

  if (!token) return <Login onLogin={(t) => { localStorage.setItem(TOKEN_KEY, t); setToken(t); }} />;

  const filtered = units.filter((u) => {
    const q = query.toLowerCase();
    return !q || u.unitName.toLowerCase().includes(q) || u.propertyName.toLowerCase().includes(q) || u.unitSlug.includes(q);
  });
  const groups: Record<string, Unit[]> = {};
  filtered.forEach((u) => { (groups[u.propertyName] ||= []).push(u); });
  const visibleCount = units.filter((u) => u.visible).length;
  const featured = Array.isArray(site.content['home.featured']) ? (site.content['home.featured'] as string[]) : [];
  const saveFeatured = (next: string[]) =>
    api('/admin/content/home.featured', { method: 'PUT', body: JSON.stringify({ value: next }) }).then(load).catch(() => {});
  const displayTitles = (site.content['unit.displayTitles'] && typeof site.content['unit.displayTitles'] === 'object'
    ? site.content['unit.displayTitles'] : {}) as Record<string, string>;
  const saveDisplayTitle = (slug: string, value: string) => {
    const next = { ...displayTitles };
    if (value) next[slug] = value; else delete next[slug];
    return api('/admin/content/unit.displayTitles', { method: 'PUT', body: JSON.stringify({ value: next }) }).then(load).catch(() => {});
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'apartments', label: 'Apartamentos' },
    { id: 'images', label: 'Imagens' },
    { id: 'content', label: 'Conteúdo' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 text-white" style={{ background: NAVY, borderBottom: `1px solid ${GOLD}66` }}>
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="font-display text-2xl tracking-tight">MCRh</span>
            <nav className="hidden md:flex gap-6">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="font-body text-[11px] uppercase tracking-[0.15em] py-1 transition-colors"
                  style={{ color: tab === t.id ? GOLD : 'rgba(255,255,255,0.6)', borderBottom: tab === t.id ? `1px solid ${GOLD}` : '1px solid transparent' }}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <span className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40">{visibleCount}/{units.length} visíveis</span>
            <button onClick={logout} className="font-body text-[10px] uppercase tracking-[0.15em] text-white/70 border border-white/25 px-4 py-1.5 hover:bg-white/10 transition-colors">Sair</button>
          </div>
        </div>
        {/* Mobile tabs */}
        <nav className="md:hidden flex gap-5 px-6 pb-3">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="font-body text-[11px] uppercase tracking-[0.12em]" style={{ color: tab === t.id ? GOLD : 'rgba(255,255,255,0.6)' }}>{t.label}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 md:px-10 py-10">
        {loading && <p className="font-body text-on-surface-variant">Carregando…</p>}

        {tab === 'apartments' && !loading && (
          <>
            {/* Featured summary / counter */}
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 pl-4 py-1" style={{ borderColor: GOLD }}>
              <span className="font-body text-[11px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
                ★ {featured.length} em destaque na home
              </span>
              {featured.length > 0 && (
                <span className="font-body text-[11px] text-on-surface-variant/70">
                  {featured.map((slug) => units.find((u) => u.unitSlug === slug)?.unitName || slug).join(' · ')}
                </span>
              )}
            </div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar apartamento ou prédio…" className={`${field} max-w-sm mb-10`} />
            {Object.entries(groups).map(([propertyName, groupUnits]) => (
              <div key={propertyName} className="mb-12">
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="font-display text-headline-md text-primary whitespace-nowrap">{propertyName}</h2>
                  <div className="flex-1 h-px" style={{ background: `${GOLD}55` }} />
                  <span className="font-body text-[10px] uppercase tracking-widest text-on-surface-variant/60">{groupUnits.length} apê(s)</span>
                </div>
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                  {groupUnits.map((u) => <div key={u.unitSlug} style={{ display: 'contents' }}><UnitCard unit={u} api={api} onChanged={load} featured={featured} onSaveFeatured={saveFeatured} displayTitles={displayTitles} onSaveDisplayTitle={saveDisplayTitle} /></div>)}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="font-body text-on-surface-variant/60">Nenhum apartamento encontrado.</p>}
          </>
        )}

        {tab === 'images' && !loading && <ImagesTab site={site} api={api} onChanged={load} />}
        {tab === 'content' && !loading && <ContentTab site={site} api={api} onChanged={load} />}
      </main>
    </div>
  );
}
