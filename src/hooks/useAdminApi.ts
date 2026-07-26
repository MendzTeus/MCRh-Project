import { useCallback, useEffect } from 'react';

// Shared by Admin.tsx and AdminApartment.tsx — previously duplicated verbatim
// in both files (Phase 8 code-quality cleanup).
export const ADMIN_TOKEN_KEY = 'mcrh_admin_token';

export function useApi(token: string | null, onUnauthorized: () => void) {
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

// Warns before closing/refreshing the tab while a form field differs from its
// last-saved value — the per-field autosave-on-blur pattern used throughout
// the admin editor already saves on any blur (including clicking away to
// navigate), so the only real risk window this closes is an accidental
// tab close/refresh mid-edit.
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}

export function fileToBase64(file: File): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: (reader.result as string).split(',')[1], type: file.type });
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
}
