// Split out of the former single-file admin (src/pages/Admin.tsx).
import { useRef, useState } from 'react';
import { fileToBase64, type useApi } from '../../../hooks/useAdminApi';
import { Btn, type SiteData } from './shared';

// Image slots the admin can override (friendly labels for the UI).
const IMAGE_SLOTS: { slot: string; label: string; page: string }[] = [
  { slot: 'home.hero', label: 'Foto de capa (hero)', page: 'Home' },
  { slot: 'home.block.chambers', label: 'Bloco Chambers', page: 'Home' },
  { slot: 'home.block.john-dalton-st', label: 'Bloco John Dalton St', page: 'Home' },
  { slot: 'home.block.wood-street', label: 'Bloco Wood Street', page: 'Home' },
  { slot: 'home.block.ancoats', label: 'Bloco Ancoats', page: 'Home' },
  { slot: 'home.block.old-trafford', label: 'Bloco Old Trafford', page: 'Home' },
  { slot: 'home.block.the-collective', label: 'Bloco The Collective', page: 'Home' },
  { slot: 'design.hero', label: 'Hero', page: 'Design Services' },
  { slot: 'design.approach', label: 'Seção "Our Approach"', page: 'Design Services' },
  { slot: 'design.before', label: 'Comparação — antes', page: 'Design Services' },
  { slot: 'design.after', label: 'Comparação — depois', page: 'Design Services' },
  { slot: 'management.hero', label: 'Hero', page: 'Management Services' },
  { slot: 'about.hero', label: 'Hero', page: 'About' },
];

// ── Images tab ──────────────────────────────────────────────────────
export function ImagesTab({ site, api, onImageChanged }: { site: SiteData; api: ReturnType<typeof useApi>; onImageChanged: (slot: string, url: string | null) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(slot: string, file: File) {
    setBusy(slot);
    setError(null);
    try {
      const { base64, type } = await fileToBase64(file);
      const res = await api(`/admin/images/${slot}`, { method: 'POST', body: JSON.stringify({ dataBase64: base64, contentType: type }) });
      onImageChanged(slot, res.url);
    } catch (err) {
      setError(`Imagem não enviada: ${(err as Error).message}`);
    } finally { setBusy(null); }
  }

  async function revert(slot: string) {
    setBusy(slot);
    setError(null);
    try {
      await api(`/admin/images/${slot}`, { method: 'DELETE' });
      onImageChanged(slot, null);
    } catch (err) {
      setError(`Não foi possível reverter: ${(err as Error).message}`);
    } finally { setBusy(null); }
  }

  return (
    <div className="max-w-3xl">
      <p className="font-body text-body-md text-on-surface-variant mb-8">Troque as imagens de capa das páginas. Sem uma imagem definida aqui, o site usa a imagem padrão.</p>
      {error && <p role="alert" className="mb-6 px-4 py-3 rounded-lg font-body text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</p>}
      <div className="divide-y divide-outline-variant/30 border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
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
                {current && <Btn onClick={() => revert(s.slot)} disabled={busy === s.slot}>Reverter</Btn>}
                <input ref={(el) => { refs.current[s.slot] = el; }} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(s.slot, f); e.target.value = ''; }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

