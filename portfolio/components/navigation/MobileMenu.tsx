'use client'

import { Menu, Moon, Sun, Languages } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { navItems } from "./Navbar";
import { useTheme } from "next-themes";

interface MobileMenuProps {
    onOpenLanguageModal: () => void;
}

export function MobileMenu({ onOpenLanguageModal }: MobileMenuProps) {
    const { setTheme } = useTheme();

    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    }

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

                <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2 cursor-pointer">
                    <span className="dark:hidden flex items-center gap-2">
                        <Sun className="h-4 w-4" /> Tema
                    </span>
                    <span className="hidden dark:flex items-center gap-2">
                        <Moon className="h-4 w-4" /> Tema
                    </span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onOpenLanguageModal} className="flex items-center gap-2 cursor-pointer">
                    <Languages className="h-4 w-4" />
                    Idioma
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}