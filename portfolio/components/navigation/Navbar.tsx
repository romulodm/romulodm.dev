'use client'

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Rss, Home, Languages, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { AuthModal } from "../auth/AuthModal";
import { Button } from "@/components/ui/button";
import { LanguageModal } from "../modals/LanguageModal";
import { useTheme } from "next-themes";
import { Dropdown } from "./Dropdown";
import { MobileMenu } from "./MobileMenu";
import { SearchDialog } from "../blog/SearchDialog";
import { NavMore } from "./NavMore";

export const navItems = [
    { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
    { label: "Blog", href: "/blog", icon: <BookOpen className="h-4 w-4" /> },
];

const Navbar = () => {
    const t = useTranslations();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [open, setOpen] = useState(false);

    const [languageModalOpen, setLanguageModalOpen] = useState(false);
    const { setTheme } = useTheme()

    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'light' : 'dark')
    }

    const openAuthModal = useCallback(() => setOpen(true), [])
    const closeAuthModal = useCallback(() => setOpen(false), [])

    const { data, status } = useSession();

    const isAdmin = !!data?.user?.admin;

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 ${scrolled ? "surface-elevated  backdrop-blur-xl bg-background/80" : ""}`}
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
                                    {item.label}
                                </Link>
                            ))}

                        </div>

                        <NavMore />

                        {isAdmin && (
                            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Admin
                            </Link>
                        )}


                    </div>

                    {/* Desktop */}
                    <div className="flex items-center gap-2">
                        <SearchDialog />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLanguageModalOpen(true)}
                            className="hidden p-2.5 md:flex text-foreground hover:bg-gray-400/60 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-foreground"
                        >
                            <Languages className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="hidden p-2.5 md:flex text-foreground hover:bg-gray-400/60 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-foreground"
                        >
                            {
                                <>
                                    <span className="dark:hidden">
                                        <Sun className="h-4 w-4" />
                                    </span>

                                    <span className="hidden dark:inline">
                                        <Moon className="h-4 w-4" />
                                    </span>

                                </>
                            }
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLanguageModalOpen(true)}
                            className="hidden p-2.5 md:flex text-foreground hover:bg-gray-400/60 dark:hover:bg-neutral-800/50 hover:text-black dark:hover:text-foreground"
                        >
                            <Rss className="h-4 w-4" />
                        </Button>

                        {data ? (
                            <Dropdown
                                user={data.user}
                                onOpenLanguageModal={() => setLanguageModalOpen(true)}
                            />
                        ) : (
                            <>
                                <button
                                    onClick={openAuthModal}
                                    className="text-sm mr-2 font-medium bg-primary text-white px-3 py-2 rounded hover:opacity-90 transition-opacity"
                                >
                                    Login
                                </button>
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
