'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
    LayoutDashboard, FileText, Mail, AlertTriangle,
    Ban, Moon, Sun, Coffee, ChevronRight, Globe, Text
} from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../Logo'

interface Props {
    user: { username: string; image: string | null; email: string } | null
}

const NAV_ITEMS = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        exact: true,
    },
    {
        label: 'Posts',
        href: '/admin/posts',
        icon: FileText,
        children: [
            { label: 'Todos os posts', href: '/admin/posts' },
            { label: 'Novo post', href: '/admin/posts/new' },
        ],
    },
    {
        label: 'Newsletter',
        href: '/admin/newsletter',
        icon: Mail,
        children: [
            { label: 'Visão geral', href: '/admin/newsletter' },
            { label: 'Campanhas', href: '/admin/newsletter/campaigns' },
            { label: 'Nova campanha', href: '/admin/newsletter/campaigns/new' },
        ],
    },
    {
        label: 'Comentários suspeitos',
        href: '/admin/suspicious-comments',
        icon: AlertTriangle,
    },
    {
        label: 'Usuários banidos',
        href: '/admin/banned-users',
        icon: Ban,
    },
    {
        label: 'Doações',
        href: '/admin/donations',
        icon: Coffee,
    },
    {
        label: 'Blog',
        href: '/blog',
        icon: Text,
        external: true,
    },
]

const LOCALES = ['pt', 'en'] as const

export function AdminSidebar({ user }: Props) {
    const pathname = usePathname()
    const { resolvedTheme, setTheme } = useTheme()
    const [expanded, setExpanded] = useState<string | null>(null)
    const [locale, setLocale] = useState<'pt' | 'en'>('pt')

    function isActive(href: string, exact = false) {
        if (exact) return pathname === href
        return pathname.startsWith(href)
    }

    function toggleExpand(label: string) {
        setExpanded((prev) => (prev === label ? null : label))
    }

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-card border-r border-border z-40">

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
                <Logo className="w-6 h-6 text-primary" />
                <span className="font-semibold text-foreground tracking-wide">romulodm.dev</span>
            </div>

            {/* Controles rápidos */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                {/* Toggle de tema */}
                <button
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Alternar tema"
                >
                    {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Toggle de idioma */}
                <button
                    onClick={() => setLocale((l) => (l === 'pt' ? 'en' : 'pt'))}
                    className="flex items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-xs font-medium"
                    title="Alternar idioma"
                >
                    <Globe className="w-4 h-4" />
                    {locale.toUpperCase()}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href, item.exact)
                    const Icon = item.icon
                    const hasChildren = item.children && item.children.length > 0
                    const isExpanded = expanded === item.label || (hasChildren && isActive(item.href))

                    return (
                        <div key={item.href}>
                            {hasChildren ? (
                                // Item com submenu
                                <button
                                    onClick={() => toggleExpand(item.label)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1 text-left">{item.label}</span>
                                    <ChevronRight
                                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    />
                                </button>
                            ) : (
                                // Item simples
                                <Link
                                    href={item.href}
                                    target={item.external ? '_blank' : undefined}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                </Link>
                            )}

                            {/* Submenu */}
                            {hasChildren && isExpanded && (
                                <div className="ml-7 mt-0.5 space-y-0.5 border-l border-border pl-3">
                                    {item.children!.map((child) => (
                                        <Link
                                            key={child.href}
                                            href={child.href}
                                            className={`flex items-center py-2 px-2 rounded-md text-xs transition-colors ${pathname === child.href
                                                ? 'text-primary font-medium'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Usuário */}
            <div className="border-t border-border p-4">
                <div className="flex items-center gap-3">
                    {user?.image ? (
                        <img
                            src={user.image}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                            {user?.username?.charAt(0).toUpperCase() ?? 'A'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {user?.username ?? 'Admin'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.email ?? ''}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    )
}