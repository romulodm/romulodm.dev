'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  FileText,
  Mail,
  AlertTriangle,
  MessageSquare,
  Ban,
  Moon,
  Sun,
  Coffee,
  ChevronRight,
  Globe,
  Text,
  Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Logo } from '../Logo';
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AvatarUser } from "@/lib/avatar";

interface Props {
  user: (AvatarUser & { email: string }) | null;
}

type NavItem = {
  id: string;
  href: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  external?: boolean;
  children?: Array<{ id: string; href: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  {
    id: 'posts',
    href: '/admin/posts',
    icon: FileText,
    children: [
      { id: 'allPosts', href: '/admin/posts' },
      { id: 'newPost', href: '/admin/posts/new' },
    ],
  },
  {
    id: 'newsletter',
    href: '/admin/newsletter',
    icon: Mail,
    children: [
      { id: 'newsletterOverview', href: '/admin/newsletter' },
      { id: 'campaigns', href: '/admin/newsletter/campaigns' },
      { id: 'newCampaign', href: '/admin/newsletter/campaigns/new' },
      { id: 'templates', href: '/admin/newsletter/templates' },
    ],
  },
  { id: 'contact', href: '/admin/contact', icon: MessageSquare },
  { id: 'suspiciousComments', href: '/admin/suspicious-comments', icon: AlertTriangle },
  { id: 'bannedUsers', href: '/admin/banned-users', icon: Ban },
  {
    id: 'coffees',
    href: '/admin/donations',
    icon: Coffee,
    children: [
      { id: 'donations', href: '/admin/donations' },
      { id: 'onchain', href: '/admin/donations/crypto' },
    ],
  },
  {
    id: 'observability',
    href: '/admin/observability/system',
    icon: Activity,
    children: [
      { id: 'system', href: '/admin/observability/system' },
      { id: 'search', href: '/admin/observability/search' },
      { id: 'backups', href: '/admin/observability/backups' },
    ],
  },
  { id: 'blog', href: '/blog', icon: Text, external: true },
];

export function AdminSidebar({ user }: Props) {
  const t = useTranslations('admin.sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function localizeHref(href: string) {
    return `/${locale}${href}`;
  }

  function isActive(href: string, exact = false) {
    const localizedHref = localizeHref(href);
    if (exact) return pathname === localizedHref;
    return pathname.startsWith(localizedHref);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function toggleLocale() {
    const nextLocale = locale === 'pt' ? 'en' : 'pt';
    const nextPath = pathname.replace(/^\/(pt|en)(?=\/|$)/, `/${nextLocale}`);
    router.push(nextPath === pathname ? `/${nextLocale}` : nextPath);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
        </Link>
        <span className="font-semibold tracking-wide text-foreground">romulodm.dev</span>
      </div>

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={t('toggleTheme')}
        >
          {mounted ? (
            resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4 block" />
          )}
        </button>

        <button
          onClick={toggleLocale}
          className="flex items-center gap-1 rounded-lg p-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={t('toggleLanguage')}
        >
          <Globe className="h-4 w-4" />
          {locale.toUpperCase()}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          const hasChildren = Boolean(item.children?.length);
          const isExpanded = expanded === item.id || (hasChildren && isActive(item.href));

          return (
            <div key={item.id}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{t(`nav.${item.id}`)}</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>
              ) : (
                <Link
                  href={localizeHref(item.href)}
                  target={item.external ? '_blank' : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t(`nav.${item.id}`)}</span>
                </Link>
              )}

              {hasChildren && isExpanded && (
                <div className="ml-[1.2rem] mt-0.5 space-y-0.5 border-l border-border pl-3">
                  {item.children!.map((child) => (
                    <Link
                      key={child.id}
                      href={localizeHref(child.href)}
                      className={`flex items-center rounded-md px-2 py-2 text-xs transition-colors ${pathname === localizeHref(child.href)
                        ? 'font-medium text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {t(`nav.${child.id}`)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          {user ? (
            <UserAvatar user={user} size={32} className="ring-1 ring-border" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              A
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.username ?? t('fallbackUser')}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}