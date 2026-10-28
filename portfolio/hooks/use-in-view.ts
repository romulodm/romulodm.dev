'use client';

import { useEffect, useState, type RefObject } from 'react';

interface UseInViewOptions {
    /** Grows the viewport for the test, e.g. '300px' to fire before the element arrives. */
    rootMargin?: string;
    /** Stop observing after the first hit and stay `true` from then on. */
    once?: boolean;
}

/**
 * Whether the element behind `ref` is on screen (or within `rootMargin` of it).
 *
 * Starts `false` and turns `true` only when the observer reports, so anything
 * gated on it never runs for an element the visitor does not scroll to. Used to
 * keep WebGL scenes from rendering while off screen and to defer heavy widgets
 * until they are about to be seen.
 */
export function useInView(
    ref: RefObject<Element | null>,
    { rootMargin = '0px', once = false }: UseInViewOptions = {},
): boolean {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setInView(entry.isIntersecting);
                if (entry.isIntersecting && once) observer.disconnect();
            },
            { rootMargin },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, rootMargin, once]);

    return inView;
}
