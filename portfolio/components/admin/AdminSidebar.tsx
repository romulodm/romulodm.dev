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
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState, useEffect, useRef, type FocusEvent } from 'react';

import { Logo } from '../Logo';
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AdminUser } from './AdminUserContext';

interface Props {
  user: AdminUser;
  /** Modo colapsado: so os icones; expande por cima do conteudo no hover. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Atraso antes de expandir no hover, para a sidebar nao abrir quando o mouse
 *  so passa por ela a caminho de outra coisa. */
const PEEK_DELAY_MS = 120;

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

export function AdminSidebar({ user, collapsed, onToggleCollapsed }: Props) {
  const t = useTranslations('admin.sidebar');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // "Espiar": a sidebar colapsada aberta temporariamente por hover ou foco.
  const [peek, setPeek] = useState(false);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => () => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
  }, []);

  // So icones: colapsada e sem ninguem espiando.
  const compact = collapsed && !peek;
  // Some com os textos no modo compacto em vez de deixa-los cortados na borda.
  const fade = `transition-opacity duration-150 ${compact ? 'opacity-0' : 'opacity-100'}`;

  function clearPeekTimer() {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    peekTimerRef.current = null;
  }

  function handleMouseEnter() {
    if (!collapsed) return;
    clearPeekTimer();
    peekTimerRef.current = setTimeout(() => setPeek(true), PEEK_DELAY_MS);
  }

  function handleMouseLeave() {
    clearPeekTimer();
    setPeek(false);
  }

  // Navegacao por teclado: focar algo dentro da sidebar tambem a expande.
  function handleFocus() {
    if (collapsed) setPeek(true);
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPeek(false);
  }

  function handleToggleCollapsed() {
    clearPeekTimer();
    setPeek(false);
    onToggleCollapsed();
  }

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

  const itemBase = `flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm transition-[width,background-color,color] duration-200 ${compact ? 'w-10' : 'w-full'}`;

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-collapsed={collapsed || undefined}
      className={`fixed left-0 top-0 z-40 h-screen overflow-hidden border-r border-border bg-card transition-[width,box-shadow] duration-200 ease-out ${compact ? 'w-16' : 'w-64'} ${collapsed && peek ? 'shadow-2xl' : ''}`}
    >
      {/* Largura fixa por dentro: a aside so recorta, o conteudo nao refaz o
          layout durante a animacao. Os icones ficam centralizados nos 64px. */}
      <div className="flex h-full w-64 flex-col">
        <div className="flex items-center gap-3 border-b border-border px-5 py-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
          </Link>
          <span className={`flex-1 truncate font-semibold tracking-wide text-foreground ${fade}`}>romulodm.dev</span>
          <button
            onClick={handleToggleCollapsed}
            tabIndex={compact ? -1 : 0}
            className={`-mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${fade}`}
            title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
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
            tabIndex={compact ? -1 : 0}
            className={`flex items-center gap-1 rounded-lg p-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${fade}`}
            title={t('toggleLanguage')}
          >
            <Globe className="h-4 w-4" />
            {locale.toUpperCase()}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 py-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            const hasChildren = Boolean(item.children?.length);
            const isExpanded = expanded === item.id || (hasChildren && isActive(item.href));
            const label = t(`nav.${item.id}`);
            const stateClass = active
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground';

            return (
              <div key={item.id}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    title={compact ? label : undefined}
                    aria-label={compact ? label : undefined}
                    className={`${itemBase} ${stateClass}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={`flex-1 whitespace-nowrap text-left ${fade}`}>{label}</span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${fade}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={localizeHref(item.href)}
                    target={item.external ? '_blank' : undefined}
                    title={compact ? label : undefined}
                    aria-label={compact ? label : undefined}
                    className={`${itemBase} ${stateClass}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={`flex-1 whitespace-nowrap ${fade}`}>{label}</span>
                  </Link>
                )}

                {hasChildren && isExpanded && !compact && (
                  <div className="ml-[1.2rem] mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {item.children!.map((child) => (
                      <Link
                        key={child.id}
                        href={localizeHref(child.href)}
                        className={`flex items-center whitespace-nowrap rounded-md px-2 py-2 text-xs transition-colors ${pathname === localizeHref(child.href)
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
              <UserAvatar user={user} size={32} className="shrink-0 ring-1 ring-border" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                A
              </div>
            )}
            <div className={`min-w-0 flex-1 ${fade}`}>
              <p className="truncate text-sm font-medium text-foreground">
                {user?.username ?? t('fallbackUser')}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
