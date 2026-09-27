"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Balao escuro, no mesmo estilo dos tooltips dos logos da secao Stack: chip
 * solido, texto branco semibold, canto lg, sombra e seta.
 *
 * Duas diferencas em relacao ao original de la:
 *
 * 1. No tema escuro o chip NAO inverte para claro — continua escuro
 *    (neutral-800) e ganha uma hairline. Um neutral-900 puro sobre o fundo
 *    #0a0a0a do site sumiria; na secao Stack isso nao aparecia porque os
 *    tooltips flutuam sobre os cards, nao sobre o fundo.
 * 2. A seta e o `Arrow` do Radix em vez de um triangulo de borda em CSS, para
 *    acompanhar sozinha o lado em que o balao abriu quando ele vira perto da
 *    borda da tela.
 */
const TooltipContent = React.forwardRef<
    React.ComponentRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "pointer-events-none z-50 select-none whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg",
                "bg-neutral-900 text-white",
                "border-none dark:bg-neutral-800 dark:text-neutral-100",
                "origin-[--radix-tooltip-content-transform-origin]",
                "duration-150 ease-out animate-in fade-in-0 zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
                className
            )}
            {...props}
        >
            {children}
            <TooltipPrimitive.Arrow
                width={11}
                height={5}
                className="fill-neutral-900 dark:fill-neutral-800"
            />
        </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
