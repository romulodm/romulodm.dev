'use client'

import type { ReactNode } from "react";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface IconTooltipProps {
    label: string;
    children: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}

/**
 * Tooltip dos icones da navbar.
 *
 * Traz o proprio TooltipProvider de proposito: os gatilhos vivem em componentes
 * independentes (SearchDialog, ThemeToggle, o proprio Navbar) e nao existe um
 * provider unico no topo da arvore. O Provider do Radix e so contexto de timing
 * — repetir/aninhar nao renderiza DOM extra.
 */
export function IconTooltip({ label, children, side = "bottom" }: IconTooltipProps) {
    return (
        <TooltipProvider delayDuration={150} skipDelayDuration={400}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                {/* Sem className: o estilo (chip escuro + seta) mora no
                    TooltipContent, para ser o mesmo em todo lugar. */}
                <TooltipContent side={side}>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
