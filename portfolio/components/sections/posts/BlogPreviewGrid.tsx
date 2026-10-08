"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

import type { HomePreviewPost } from "@/lib/home-blog-preview";

import BlogCard from "./BlogCard";

export type PreviewItem = { post: HomePreviewPost; readingTime: string | null };

/*
 * Which of the `featured` posts takes the large card.
 *
 * The home page is cached HTML (ISR), so a draw made on the server would show
 * the same post to every visitor until the next revalidation. The draw happens
 * in the browser instead, once per page load, and is kept in module scope so
 * every render of this load agrees on it.
 *
 * useSyncExternalStore is what makes this hydration-safe: React renders the
 * server snapshot (index 0) while hydrating, so the markup matches the HTML,
 * and then switches to the client snapshot without a mismatch error. The
 * section sits far below the fold, so the swap happens before anyone scrolls
 * to it. The same pattern without the store (useState + useEffect) would work
 * too, but would render twice for nothing on every load.
 */
let drawnIndex: number | null = null;

const subscribe = () => () => {};

function getClientSnapshot(): number {
    if (drawnIndex === null) drawnIndex = Math.random() < 0.5 ? 0 : 1;
    return drawnIndex;
}

const getServerSnapshot = () => 0;

interface BlogPreviewGridProps {
    featured: PreviewItem[];
    list: PreviewItem[];
    closing: PreviewItem | null;
    readMore: string;
}

/*
 * Layout on lg: one grid, two columns, one row per entry of the right column.
 *
 *   row 1     | featured (spans rows 1..n-1) | list entry 1
 *   ...       |                              | ...
 *   row n     | closing                      | list entry n
 *
 * Sharing rows is what keeps the closing entry level with the last entry on
 * the right whatever the length of the titles and summaries: two separate
 * flex columns would only line up by coincidence. Rows have no gap, so the
 * divider above the closing entry and the one above the last list entry fall
 * on the same line.
 *
 * Below lg the grid is a single column in DOM order: featured, list, closing.
 */
export default function BlogPreviewGrid({ featured, list, closing, readMore }: BlogPreviewGridProps) {
    const drawn = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

    // With fewer than two featured posts published there is nothing to draw.
    const index = featured.length > 1 ? drawn % featured.length : 0;
    const main = featured[index] ?? null;

    // The featured post that lost the draw opens the list, above the fixed ones.
    const side = [...featured.filter((_, i) => i !== index), ...list];

    const card = (item: PreviewItem, variant?: "featured") => (
        <BlogCard post={item.post} readingTime={item.readingTime} readMore={readMore} variant={variant} />
    );

    if (!main) {
        // No cover to pair the list with: a plain single column.
        const entries = closing ? [...side, closing] : side;
        if (entries.length === 0) return null;
        return (
            <div className="flex flex-col">
                {entries.map((item, i) => (
                    <div key={item.post.slug} className={i < entries.length - 1 ? "border-b border-border" : ""}>
                        {card(item)}
                    </div>
                ))}
            </div>
        );
    }

    const n = side.length;
    // The closing entry takes the row of the last list entry. With fewer than
    // two list entries there is no such row to share, so it goes under the
    // featured one instead.
    const closingRow = Math.max(n, 2);
    const featuredEnd = closing ? closingRow : Math.max(n, 1) + 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16">
            <div
                className="pb-6 lg:col-start-1 lg:[grid-row:1_/_var(--row-end)]"
                style={{ "--row-end": featuredEnd } as CSSProperties}
            >
                {card(main, "featured")}
            </div>

            {side.map((item, i) => {
                const isLast = i === n - 1;
                return (
                    <div
                        key={item.post.slug}
                        className={[
                            "border-border lg:col-start-2 lg:[grid-row:var(--row)]",
                            // The divider under the last list entry only exists on
                            // mobile, where the closing entry comes right after it.
                            isLast ? (closing ? "border-b lg:border-b-0" : "") : "border-b",
                            // Cancels the first entry's top padding (see BlogCard), so
                            // its label lines up with the top of the cover.
                            i === 0 ? "lg:-mt-6" : "",
                        ].join(" ")}
                        style={{ "--row": i + 1 } as CSSProperties}
                    >
                        {card(item)}
                    </div>
                );
            })}

            {closing && (
                <div
                    className="border-border lg:col-start-1 lg:border-t lg:[grid-row:var(--row)]"
                    style={{ "--row": closingRow } as CSSProperties}
                >
                    {card(closing)}
                </div>
            )}
        </div>
    );
}
