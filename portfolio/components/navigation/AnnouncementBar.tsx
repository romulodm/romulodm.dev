'use client'

import { useEffect, type RefObject } from "react";
import { useTranslations } from "next-intl";

/**
 * Thin strip above the navbar, visible whenever the page is at the top.
 *
 * The strip is in normal document flow, not inside the fixed <nav>. It therefore
 * pushes the page down by its own height instead of covering the first heading,
 * and it leaves the viewport the natural way as the page scrolls. The fixed nav
 * sits right below it and follows it up until it reaches the top edge (see
 * `useAnnouncementOffset`). Scrolling back to 0 brings the strip back with no
 * extra state: it never actually hides, it just scrolls.
 *
 * The copy lives in `navigation.announcement` in messages/{en,pt}.json. Deleting
 * that key in both files turns the strip off everywhere without touching code.
 *
 * Colors and animation are in globals.css (`.announcement-bar`).
 */
export function AnnouncementBar({ ref }: { ref?: RefObject<HTMLDivElement | null> }) {
    const t = useTranslations("navigation");

    return (
        // z-50 keeps the strip above the hero's lanyard canvas, which extends
        // 56px above its section (-mt-14).
        <div ref={ref} className="announcement-bar z-50">
            <p className="relative z-[1] mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-2 text-center text-sm font-semibold">
                <span aria-hidden>🎉</span>
                {t("announcement")}
            </p>
        </div>
    );
}

/**
 * Keeps the fixed nav glued to the bottom edge of the announcement strip:
 * `top = max(0, stripHeight - scrollY)`.
 *
 * The value is written to the `--announcement-offset` custom property on the nav
 * element instead of React state, so scrolling does not re-render the navbar on
 * every frame. The nav's inline style carries a fallback for the value before
 * hydration, so the server-rendered page does not flash the nav over the strip.
 *
 * With no strip (`barRef.current` is null) the offset is 0.
 */
export function useAnnouncementOffset(
    navRef: RefObject<HTMLElement | null>,
    barRef: RefObject<HTMLElement | null>,
) {
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const height = barRef.current?.offsetHeight ?? 0;
            const offset = Math.max(0, height - window.scrollY);
            nav.style.setProperty("--announcement-offset", `${offset}px`);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);

        // The strip can change height without a window resize (text wrapping
        // after a font swap, locale change).
        const observer = barRef.current ? new ResizeObserver(schedule) : null;
        if (observer && barRef.current) observer.observe(barRef.current);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            observer?.disconnect();
        };
    }, [navRef, barRef]);
}
