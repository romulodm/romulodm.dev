'use client';

import { useCallback, useState } from 'react';

import { AdminSidebar } from './AdminSidebar';
import { AdminUserProvider, type AdminUser } from './AdminUserContext';
import { ADMIN_SIDEBAR_COOKIE } from '@/lib/admin-sidebar';

interface Props {
  user: AdminUser;
  initialCollapsed: boolean;
  children: React.ReactNode;
}

export function AdminShell({ user, initialCollapsed, children }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${ADMIN_SIDEBAR_COOKIE}=${next ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <AdminUserProvider user={user}>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar user={user} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        {/* Conteudo empurrado pela largura da sidebar. No modo colapsado a
            sidebar expande por cima do conteudo no hover, sem empurra-lo. */}
        <div
          className={`min-h-screen min-w-0 flex-1 transition-[margin] duration-200 ease-out ${collapsed ? 'ml-16' : 'ml-64'}`}
        >
          {children}
        </div>
      </div>
    </AdminUserProvider>
  );
}
