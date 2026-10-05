'use client';

import { createContext, useContext } from 'react';
import type { AvatarUser } from '@/lib/avatar';

export type AdminUser = (AvatarUser & { email: string }) | null;

const AdminUserContext = createContext<AdminUser>(null);

/** Disponibiliza o usuario admin (buscado no layout do admin) para os client
 *  components da area, como o preview do post, que precisa do autor. */
export function AdminUserProvider({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  return <AdminUserContext.Provider value={user}>{children}</AdminUserContext.Provider>;
}

export function useAdminUser() {
  return useContext(AdminUserContext);
}
