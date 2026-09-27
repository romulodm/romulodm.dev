'use client'

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import {
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export const THEME_OPTIONS = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
] as const;

export type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];

/**
 * Os tres itens de tema (claro / escuro / sistema) para reaproveitar dentro de
 * qualquer DropdownMenuContent — o menu mobile e o menu do usuario usam os
 * mesmos, para que "sistema" nao fique acessivel so no desktop.
 *
 * O `mounted` existe porque `theme` so e conhecido no cliente: no servidor ele e
 * undefined e marcar um item antes da hidratacao geraria mismatch.
 */
export function ThemeMenuItems({ withLabel = true }: { withLabel?: boolean }) {
    const t = useTranslations("navigation");
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <>
            {withLabel && (
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {t("theme")}
                </DropdownMenuLabel>
            )}

            <DropdownMenuRadioGroup
                value={mounted ? theme ?? "system" : undefined}
                onValueChange={setTheme}
            >
                {THEME_OPTIONS.map(({ value, icon: Icon }) => (
                    <DropdownMenuRadioItem
                        key={value}
                        value={value}
                        // Indicador do radio empurrado para a direita: a esquerda
                        // fica com o icone da opcao, como no resto do menu.
                        className="cursor-pointer gap-2 pl-2 pr-8 [&>span:first-child]:left-auto [&>span:first-child]:right-2"
                    >
                        <Icon className="h-4 w-4" />
                        {t(`themeOptions.${value}`)}
                    </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
        </>
    );
}
