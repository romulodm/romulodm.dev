'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Movement (in px) a press has to travel before it counts as a drag. Below it
 * the press stays an ordinary click, so selecting an item still works with a
 * slightly shaky hand.
 */
const DRAG_THRESHOLD = 5;

/**
 * Lets the horizontally scrollable element behind `ref` be grabbed and dragged
 * sideways with the mouse.
 *
 * Only mouse input is handled: touch and pen already scroll natively, and
 * taking them over would fight the browser's own momentum scrolling.
 *
 * While a drag is in progress the element carries `data-dragging="true"`, so
 * the cursor can switch from `grab` to `grabbing` in CSS alone, with no React
 * re-render per pointer move.
 *
 * A press that turned into a drag swallows the click that follows it. Without
 * that, releasing the mouse over a button inside the element would also
 * activate it, and every drag would end by selecting whatever sat under the
 * cursor.
 *
 * Presses on the native scrollbar are ignored. The browser already drags the
 * thumb there, and applying this handler on top would move the content in the
 * opposite direction of the thumb.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>): void {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let pointerId: number | null = null;
        let startX = 0;
        let startScrollLeft = 0;
        let dragged = false;

        const onPointerDown = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            const rect = el.getBoundingClientRect();
            if (e.clientY - rect.top > el.clientHeight) return;

            pointerId = e.pointerId;
            startX = e.clientX;
            startScrollLeft = el.scrollLeft;
            dragged = false;
        };

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerId !== pointerId) return;
            const dx = e.clientX - startX;
            if (!dragged) {
                if (Math.abs(dx) < DRAG_THRESHOLD) return;
                dragged = true;
                el.setPointerCapture(e.pointerId);
                el.dataset.dragging = 'true';
            }
            el.scrollLeft = startScrollLeft - dx;
        };

        const endDrag = (e: PointerEvent) => {
            if (e.pointerId !== pointerId) return;
            pointerId = null;
            delete el.dataset.dragging;
            if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        };

        const onClickCapture = (e: MouseEvent) => {
            if (!dragged) return;
            dragged = false;
            e.preventDefault();
            e.stopPropagation();
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);
        el.addEventListener('click', onClickCapture, true);

        return () => {
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', endDrag);
            el.removeEventListener('pointercancel', endDrag);
            el.removeEventListener('click', onClickCapture, true);
        };
    }, [ref]);
}
