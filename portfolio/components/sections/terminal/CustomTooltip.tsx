import { CgClose } from "react-icons/cg";

import type { JSX, ReactNode } from "react";

import { cn } from "@/lib/utils";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface CustomTooltipProps {
    position: TooltipPosition;
    content: string;
    /** Accessible name of the dismiss button. */
    closeLabel: string;
    children: ReactNode;
    onClose: () => void;
}

const BUBBLE_POSITION: Record<TooltipPosition, string> = {
    top: "left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)]",
    bottom: "left-1/2 -translate-x-1/2 top-[calc(100%+8px)]",
    left: "top-1/2 -translate-y-1/2 right-[calc(100%+8px)]",
    right: "top-1/2 -translate-y-1/2 left-[calc(100%+8px)]",
};

// A rotated square half-hidden behind the bubble, centred on the edge that
// faces the trigger.
const ARROW_POSITION: Record<TooltipPosition, string> = {
    top: "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "left-full top-1/2 -translate-y-1/2 -translate-x-1/2",
    right: "right-full top-1/2 -translate-y-1/2 translate-x-1/2",
};

/**
 * Persistent hint pinned to the terminal's "+" button until the visitor opens
 * the interactive tab or dismisses it. Unlike the hover tooltips in
 * `components/ui/tooltip.tsx`, it is visible without any interaction, which is
 * why it uses the accent colour instead of the neutral chip.
 */
export default function CustomTooltip({ position, content, closeLabel, children, onClose }: CustomTooltipProps): JSX.Element {
    return (
        <div className="relative">
            {children}
            <div
                className={cn(
                    "absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 py-1.5 pl-3 pr-1.5 text-xs font-medium text-white shadow-lg shadow-blue-600/25",
                    BUBBLE_POSITION[position],
                )}
            >
                <span>{content}</span>
                <button
                    type="button"
                    aria-label={closeLabel}
                    onClick={onClose}
                    className="flex size-5 items-center justify-center rounded-md transition-colors hover:bg-white/20"
                >
                    <CgClose />
                </button>
                <span aria-hidden="true" className={cn("absolute -z-10 size-2 rotate-45 bg-blue-600", ARROW_POSITION[position])} />
            </div>
        </div>
    );
}
