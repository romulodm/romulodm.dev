'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { BookOpen, Rss, Home, Languages, LogIn } from "lucide-react";
import Link from "next/link";
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
import { useAnnouncementOffset } from "./AnnouncementBar";

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
    const hasAnnouncement = t.has("navigation.announcement");
    useAnnouncementOffset(navRef, announcementRef);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <>
            {/* {hasAnnouncement && <AnnouncementBar ref={announcementRef} />} */}

            <nav
                ref={navRef}
                // Fallback until useAnnouncementOffset runs: 2.25rem is the
                // strip's single-line height (py-2 + 20px line).
                style={{ top: `var(--announcement-offset, ${hasAnnouncement ? "2.25rem" : "0px"})` }}
                className={`fixed left-0 right-0 z-50 ${scrolled ? "surface-elevated  backdrop-blur-xl bg-background/80" : ""}`}
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
