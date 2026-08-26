'use client'

import { Menu, Rss, Languages } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeMenuItems } from "./ThemeMenuItems";
import Link from "next/link";
import { navItems } from "./Navbar";
import { useLocale, useTranslations } from "next-intl";

interface MobileMenuProps {
    onOpenLanguageModal: () => void;
}

export function MobileMenu({ onOpenLanguageModal }: MobileMenuProps) {
    const locale = useLocale();
    const t = useTranslations("navigation");

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button className="md:hidden p-2 text-foreground hover:bg-gray-200 dark:hover:bg-secondary hover:text-black dark:hover:text-foreground rounded">
                    <Menu className="h-5 w-5" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" side="bottom" sideOffset={12} className="w-48 bg-card md:hidden border-border">
                {navItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2 text-sm">
                            {item.icon}
                            {item.label}
                        </Link>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {/* Claro / escuro / sistema — as mesmas tres opcoes do desktop, para
                    que "sistema" nao fique inalcancavel no mobile. */}
                <ThemeMenuItems />

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onOpenLanguageModal} className="flex items-center gap-2 cursor-pointer">
                    <Languages className="h-4 w-4" />
                    {t("language")}
                </DropdownMenuItem>

                {/* O botao de RSS do desktop fica escondido no mobile (md:flex),
                    entao o feed precisa de uma entrada propria aqui. */}
                <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
                    <a
                        href={`/${locale}/feed.xml`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Rss className="h-4 w-4" />
                        RSS
                    </a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}