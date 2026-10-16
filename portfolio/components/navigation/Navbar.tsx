'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { BookOpen, Rss, Home, Languages, LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { AuthModal } from "../auth/AuthModal";
import { Button } from "@/components/ui/button";
import { LanguageModal } from "../modals/LanguageModal";
import { Dropdown } from "./Dropdown";
import { MobileMenu } from "./MobileMenu";
import { SearchDialog } from "../blog/SearchDialog";
import { NavMore } from "./NavMore";
import type { NavLinkKey } from "./moreItems";
import { IconTooltip } from "./IconTooltip";
import { ThemeToggle } from "./ThemeToggle";
import { AnnouncementBar, useAnnouncementOffset } from "./AnnouncementBar";

/**
 * Single switch for the announcement strip. The nav's server-rendered `top`
 * reserves room for the strip whenever it is shown, so rendering and that
 * reservation must read the same flag: when they disagree, the nav paints
 * 2.25rem low and jumps up after hydration.
 */
const SHOW_ANNOUNCEMENT = false;

export const navItems: { key: NavLinkKey; href: string; icon: ReactNode }[] = [
    { key: "home", href: "/", icon: <Home className="h-4 w-4" /> },
    { key: "blog", href: "/blog", icon: <BookOpen className="h-4 w-4" /> },
];

const Navbar = () => {
    const t = useTranslations();
    const locale = useLocale();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [open, setOpen] = useState(false);

    const [languageModalOpen, setLanguageModalOpen] = useState(false);

    const openAuthModal = useCallback(() => setOpen(true), [])
    const closeAuthModal = useCallback(() => setOpen(false), [])

    const { data, status } = useSession();

    const isAdmin = !!data?.user?.admin;

    const navRef = useRef<HTMLElement>(null);
    const announcementRef = useRef<HTMLDivElement>(null);
    const hasAnnouncement = SHOW_ANNOUNCEMENT && t.has("navigation.announcement");
    useAnnouncementOffset(navRef, announcementRef);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 50);
        // On reload the browser restores the scroll position before this
        // listener exists, so no scroll event fires: read the position once.
        handler();
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <>
            {hasAnnouncement && <AnnouncementBar ref={announcementRef} />}

            <nav
                ref={navRef}
                // Fallback until useAnnouncementOffset runs: 2.25rem is the
                // strip's single-line height (py-2 + 20px line).
                style={{ top: `var(--announcement-offset, ${hasAnnouncement ? "2.25rem" : "0px"})` }}
                // The background past 50px of scroll comes from CSS
                // (`.nav-surface` in globals.css), so it is right on the first
                // paint after a reload. `data-scrolled` only drives the fallback
                // for browsers without scroll-driven animations.
                data-scrolled={scrolled}
                className="nav-surface fixed left-0 right-0 z-50"
            >
                <div className="container max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
                    <div className="flex items-center gap-5">
                        <Link href="/" className="font-mono text-sm font-semibold text-foreground tracking-tight">
                            <span className="text-primary">~</span>/romulodm
                        </Link>

                        <div className="hidden md:flex gap-5">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {t(`navigation.links.${item.key}.label`)}
                                </Link>
                            ))}

                        </div>

                        <NavMore />

                        {isAdmin && (
                            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                {t("navigation.admin")}
                            </Link>
                        )}


                    </div>

                    {/* Desktop */}
                    <div className="flex items-center gap-2">
                        <SearchDialog />

                        <IconTooltip label={t('navigation.tooltip.language')}>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLanguageModalOpen(true)}
                                aria-label={t('navigation.tooltip.language')}
                                className="hidden p-2.5 md:flex text-foreground hover:bg-gray-400/60 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-foreground"
                            >
                                <Languages className="h-4 w-4" />
                            </Button>
                        </IconTooltip>

                        <ThemeToggle />

                        {/* Este botao chamava setLanguageModalOpen — abria o modal
                            de idioma em vez do feed. Agora aponta para o RSS do
                            locale atual. */}
                        <IconTooltip label={t('navigation.tooltip.rss')}>
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="hidden p-2.5 md:flex text-foreground hover:bg-gray-400/60 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-foreground"
                            >
                                {/* Sem `title`: o atributo nativo abriria um segundo
                                    balao do navegador por cima do tooltip. */}
                                <a
                                    href={`/${locale}/feed.xml`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t('seo.feed.title')}
                                >
                                    <Rss className="h-4 w-4" />
                                </a>
                            </Button>
                        </IconTooltip>

                        {data ? (
                            <Dropdown
                                user={data.user}
                                onOpenLanguageModal={() => setLanguageModalOpen(true)}
                            />
                        ) : (
                            <>
                                {/* Ghost com icone, o mesmo tratamento dos icones ao
                                    lado: entrar nao e a acao principal de um blog, e o
                                    laranja solido brigava com o `~` da marca. Sem
                                    tooltip — o botao ja tem rotulo. */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={openAuthModal}
                                    className="px-3 py-2 text-sm font-medium text-foreground hover:bg-gray-400/60 hover:text-black dark:hover:bg-neutral-800/50 dark:hover:text-foreground"
                                >
                                    <LogIn className="h-4 w-4" />
                                    {t('navigation.login')}
                                </Button>
                                <MobileMenu onOpenLanguageModal={() => setLanguageModalOpen(true)} />
                            </>
                        )}

                    </div>

                    {/* Mobile toggle */}
                    {/* <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden text-foreground"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button> */}
                </div>

            </nav>

            <LanguageModal open={languageModalOpen} onOpenChange={setLanguageModalOpen} />
            <AuthModal open={open} onClose={closeAuthModal} />
        </>
    );
};

export default Navbar;
