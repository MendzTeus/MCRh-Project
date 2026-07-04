import { useState, useEffect, useCallback, useRef, type FormEvent, type CSSProperties } from 'react';

// ── Types ───────────────────────────────────────────────────────────
type Photo = { id: string; url: string; alt: string | null; isPrimary: boolean; displayOrder: number };
type Unit = {
  unitSlug: string; unitName: string; propertySlug: string; propertyName: string;
  suppliedSpecs: string | null; postcode: string | null; airbnbUrl: string | null;
  description: string | null; visible: boolean; displayOrder: number; photos: Photo[];
};

const TOKEN_KEY = 'mcrh_admin_token';

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

// ── Login screen ────────────────────────────────────────────────────
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1c18', fontFamily: 'sans-serif' }}>
      <form onSubmit={submit} style={{ background: '#fdf9f3', padding: 40, borderRadius: 16, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1c1c18', marginBottom: 4 }}>MCRh</div>
        <div style={{ fontSize: 13, color: '#44474c', marginBottom: 28, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Painel de Administração</div>
        <label style={{ fontSize: 12, color: '#44474c', display: 'block', marginBottom: 6 }}>Senha</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(197,198,205,0.6)', borderRadius: 8, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }} />
        {error && <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: '100%', padding: '11px 0', background: '#1c1c18', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

// ── Photo tile ──────────────────────────────────────────────────────
function PhotoTile({ photo, onSetCover, onDelete }: { photo: Photo; onSetCover: () => void; onDelete: () => void }) {
  return (
    <div style={{ position: 'relative', width: 88, height: 88, borderRadius: 8, overflow: 'hidden', border: photo.isPrimary ? '2px solid #C8A45C' : '1px solid rgba(197,198,205,0.5)', flexShrink: 0 }}>
      <img src={photo.url} alt={photo.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {photo.isPrimary && <div style={{ position: 'absolute', top: 0, left: 0, background: '#C8A45C', color: '#fff', fontSize: 9, padding: '1px 5px', borderBottomRightRadius: 6, fontWeight: 600 }}>CAPA</div>}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', background: 'rgba(0,0,0,0.55)' }}>
        {!photo.isPrimary && <button title="Definir como capa" onClick={onSetCover} style={{ flex: 1, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, padding: '3px 0' }}>★</button>}
        <button title="Excluir" onClick={onDelete} style={{ flex: 1, background: 'none', border: 'none', color: '#ff8a80', cursor: 'pointer', fontSize: 11, padding: '3px 0' }}>✕</button>
      </div>
    </div>
  );
}

// ── Unit card ───────────────────────────────────────────────────────
function UnitCard({ unit, api, onChanged }: { unit: Unit; api: ReturnType<typeof useApi>; onChanged: () => void }) {
  const [name, setName] = useState(unit.unitName);
  const [specs, setSpecs] = useState(unit.suppliedSpecs || '');
  const [airbnb, setAirbnb] = useState(unit.airbnbUrl || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(unit.unitName); setSpecs(unit.suppliedSpecs || ''); setAirbnb(unit.airbnbUrl || ''); }, [unit]);

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setStatus('saving');
    try { await api(`/admin/units/${unit.unitSlug}`, { method: 'PATCH', body: JSON.stringify(patch) }); setStatus('saved'); setTimeout(() => setStatus('idle'), 1500); onChanged(); }
    catch { setStatus('error'); }
  }, [api, unit.unitSlug, onChanged]);

  async function uploadPhoto(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setStatus('saving');
      try { await api(`/admin/units/${unit.unitSlug}/photos`, { method: 'POST', body: JSON.stringify({ dataBase64: base64, contentType: file.type, alt: unit.unitName }) }); setStatus('saved'); onChanged(); }
      catch { setStatus('error'); }
    };
    reader.readAsDataURL(file);
  }

  const inputStyle: CSSProperties = { padding: '7px 10px', border: '1px solid rgba(197,198,205,0.6)', borderRadius: 6, fontSize: 13, width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(197,198,205,0.4)', borderRadius: 12, padding: 16, opacity: unit.visible ? 1 : 0.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#8a8d93', letterSpacing: '0.06em' }}>{unit.unitSlug}</span>
        <button type="button" onClick={() => save({ visible: !unit.visible })} aria-pressed={unit.visible}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#1c1c18', background: 'none', border: 'none', padding: 0 }}>
          <span>{unit.visible ? 'Visível' : 'Oculto'}</span>
          <span style={{ width: 40, height: 22, borderRadius: 11, background: unit.visible ? '#2e7d32' : '#c5c6cd', position: 'relative', transition: 'background 0.2s', display: 'inline-block' }}>
            <span style={{ position: 'absolute', top: 2, left: unit.visible ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </span>
        </button>
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== unit.unitName && save({ unitName: name })} placeholder="Nome do apartamento" style={{ ...inputStyle, fontWeight: 600 }} />
        <input value={specs} onChange={(e) => setSpecs(e.target.value)} onBlur={() => specs !== (unit.suppliedSpecs || '') && save({ suppliedSpecs: specs })} placeholder="Ex.: 2BED 2BATH" style={inputStyle} />
        <input value={airbnb} onChange={(e) => setAirbnb(e.target.value)} onBlur={() => airbnb !== (unit.airbnbUrl || '') && save({ airbnbUrl: airbnb })} placeholder="Link do Airbnb" style={inputStyle} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {unit.photos.map((p) => (
          <div key={p.id} style={{ display: 'contents' }}>
            <PhotoTile photo={p}
              onSetCover={async () => { await api(`/admin/photos/${p.id}`, { method: 'PATCH', body: JSON.stringify({ isPrimary: true }) }); onChanged(); }}
              onDelete={async () => { if (confirm('Excluir esta foto?')) { await api(`/admin/photos/${p.id}`, { method: 'DELETE' }); onChanged(); } }}
            />
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} style={{ width: 88, height: 88, borderRadius: 8, border: '1px dashed rgba(197,198,205,0.8)', background: '#faf7f2', cursor: 'pointer', color: '#8a8d93', fontSize: 12, flexShrink: 0 }}>+ Foto</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ''; }} />
      </div>

      <div style={{ marginTop: 8, height: 16, fontSize: 11, color: status === 'error' ? '#c0392b' : '#2e7d32' }}>
        {status === 'saving' && '⟳ Salvando…'}{status === 'saved' && '✓ Salvo'}{status === 'error' && '⚠ Erro ao salvar'}
      </div>
    </div>
  );
}

// ── Main admin page ─────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); setUnits([]); }, []);
  const api = useApi(token, logout);

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api('/admin/units'); setUnits(data.units); } catch { /* handled */ } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { if (token) load(); }, [token, load]);

  function handleLogin(t: string) { localStorage.setItem(TOKEN_KEY, t); setToken(t); }

  if (!token) return <Login onLogin={handleLogin} />;

  const filtered = units.filter((u) => {
    const q = query.toLowerCase();
    return !q || u.unitName.toLowerCase().includes(q) || u.propertyName.toLowerCase().includes(q) || u.unitSlug.includes(q);
  });
  const groups: Record<string, Unit[]> = {};
  filtered.forEach((u) => { (groups[u.propertyName] ||= []).push(u); });
  const visibleCount = units.filter((u) => u.visible).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f0ea', fontFamily: 'sans-serif' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1c1c18', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>MCRh</span>
          <span style={{ fontSize: 12, color: '#c5c6cd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Apartamentos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#c5c6cd' }}>{visibleCount}/{units.length} visíveis</span>
          <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Sair</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar apartamento ou prédio…"
          style={{ width: '100%', maxWidth: 360, padding: '10px 14px', border: '1px solid rgba(197,198,205,0.6)', borderRadius: 8, fontSize: 14, marginBottom: 24, boxSizing: 'border-box' }} />

        {loading && <p style={{ color: '#44474c' }}>Carregando…</p>}

        {Object.entries(groups).map(([propertyName, groupUnits]) => (
          <div key={propertyName} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1c1c18', margin: 0, whiteSpace: 'nowrap' }}>{propertyName}</h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(197,198,205,0.6)' }} />
              <span style={{ fontSize: 11, color: '#8a8d93' }}>{groupUnits.length} apê(s)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {groupUnits.map((u) => <div key={u.unitSlug} style={{ display: 'contents' }}><UnitCard unit={u} api={api} onChanged={load} /></div>)}
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && <p style={{ color: '#8a8d93' }}>Nenhum apartamento encontrado.</p>}
      </div>
    </div>
  );
}
