import { useState, type FormEvent } from 'react';
import { useAdminAuth } from './AdminAuthContext';

const GOLD = '#C5A059';
const NAVY = '#101c2d';
const label = 'font-body text-[10px] uppercase tracking-[0.15em] text-on-surface-variant block mb-1.5';
const field = 'w-full bg-transparent border-b border-outline-variant/50 py-1.5 font-body text-sm text-on-surface focus:outline-none focus:border-[#C5A059] transition-colors';

export function AdminLogin() {
  const { login, loading } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(password);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: NAVY }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-surface p-12" style={{ borderTop: `2px solid ${GOLD}` }}>
        <div className="font-display text-4xl text-primary mb-1 tracking-tight">MCRh</div>
        <div className="font-body text-[11px] uppercase tracking-[0.2em] text-on-surface-variant mb-10">
          Painel de Administração
        </div>
        <label className={label}>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className={`${field} mb-8`}
        />
        {error && <div className="font-body text-sm mb-6" style={{ color: '#ba1a1a' }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg font-body text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40"
          style={{ border: `1px solid ${GOLD}`, color: GOLD, background: 'transparent' }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
