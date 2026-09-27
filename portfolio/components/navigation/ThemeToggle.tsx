'use client'

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconTooltip } from "./IconTooltip";
import { ThemeMenuItems } from "./ThemeMenuItems";

/**
 * Botao de tema do desktop: abre claro / escuro / sistema em vez de alternar
 * direto entre dois estados — sem dropdown nao havia como voltar para "sistema"
 * depois da primeira escolha.
 *
 * O icone do gatilho continua sendo decidido por CSS (dark:hidden) e nao por
 * `resolvedTheme`, para nao depender da hidratacao e evitar o flash do icone
 * errado no primeiro paint.
 */
export function ThemeToggle() {
    const t = useTranslations("navigation");

    return (
        <DropdownMenu modal={false}>
            <IconTooltip label={t("tooltip.theme")}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("tooltip.theme")}
                        className="hidden p-2.5 text-foreground hover:bg-gray-400/60 hover:text-black md:flex dark:hover:bg-neutral-800/50 dark:hover:text-foreground"
                    >
                        <span className="dark:hidden">
                            <Sun className="h-4 w-4" />
                        </span>
                        <span className="hidden dark:inline">
                            <Moon className="h-4 w-4" />
                        </span>
                    </Button>
                </DropdownMenuTrigger>
            </IconTooltip>

            <DropdownMenuContent align="end" sideOffset={8} className="w-44 border-border bg-card">
                <ThemeMenuItems />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
