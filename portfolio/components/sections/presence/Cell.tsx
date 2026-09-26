'use client';

import type { ReactNode } from 'react';

/**
 * Shared shell of the "Agora" strip cells.
 *
 * The strip is one CSS grid with eight cells: three fixed links plus the status
 * on the first row, and four live values on the second. Because the cells come
 * from two different components, the dividers are computed from each cell's
 * index instead of `nth-child` — a CSS rule could not tell a link cell from a
 * live one, and two competing `nth-child` variants at the same breakpoint would
 * depend on the order Tailwind happens to emit them in.
 *
 * Columns per breakpoint: 1, then 2 from `sm`, then 4 from `xl`. A cell draws a
 * top border when it is not on the first visible row, and a left border when it
 * is not the first of its row, and reserves room on the right when it is not
 * the last of its row — without that, a long commit message is truncated flush
 * against the divider of the cell next to it.
 *
 * The divider colour is the same pair of greys as the home page `<hr>`s.
 *
 * `min-w-0` is what actually allows the truncation: a grid item defaults to
 * `min-width: auto`, so it refuses to shrink below its content and the whole
 * strip pushes a horizontal scrollbar onto the page instead.
 */
export function cellClass(index: number): string {
    return [
        'flex min-w-0 flex-col justify-between gap-6 py-7 border-[#e5e7eb] dark:border-[#2f3031]',
        index > 0 && 'border-t',
        // Second cell shares the first row from `sm` up, so it drops the rule
        // it inherited from the single-column layout.
        index === 1 && 'sm:border-t-0',
        // Same reasoning for the first four cells once there are four columns.
        index > 0 && index < 4 && 'xl:border-t-0',
        // Two columns: the left one of each pair. Cells with `index % 4 === 3`
        // are always odd, so they never take this and there is no rule fighting
        // the `xl` one below.
        index % 2 === 0 && 'sm:pr-6',
        index % 4 !== 0 && 'xl:border-l xl:pl-8',
        index % 4 !== 3 && 'xl:pr-8',
    ]
        .filter(Boolean)
        .join(' ');
}

export function Eyebrow({ accent, label }: { accent: string; label: string }) {
    return (
        <span className="flex items-center gap-2.5">
            <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0"
                style={{ backgroundColor: accent }}
            />
            {/*
             * The mono font is already loaded in the root layout; it is used
             * through the variable because the project does not map a
             * `font-mono` family of its own in Tailwind.
             */}
            <span className="min-w-0 truncate font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {label}
            </span>
        </span>
    );
}

/** Title + subtitle block, so every cell in the strip has the same rhythm. */
export function CellBody({
    title,
    subtitle,
    mono = false,
}: {
    title: ReactNode;
    subtitle: ReactNode;
    mono?: boolean;
}) {
    return (
        <span className="block min-w-0">
            <span
                className={`flex min-w-0 items-center gap-2.5 overflow-hidden text-foreground ${mono ? 'font-mono text-sm font-medium' : 'text-base font-semibold'}`}
            >
                {title}
            </span>
            <span className="mt-1 block truncate text-sm text-muted-foreground">
                {subtitle}
            </span>
        </span>
    );
}
