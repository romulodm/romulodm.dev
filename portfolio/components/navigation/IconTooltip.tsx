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
        <TooltipProvider delayDuration={250} skipDelayDuration={400}>
            <Tooltip>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    side={side}
                    sideOffset={8}
                    className="border border-border bg-card font-medium text-foreground shadow-md"
                >
                    {label}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
