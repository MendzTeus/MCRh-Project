import type { ReactNode } from 'react';
import { AdminLogin } from './AdminLogin';
import { useAdminAuth } from './AdminAuthContext';

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAdminAuth();

  if (!authenticated) return <AdminLogin />;
  return <>{children}</>;
}
