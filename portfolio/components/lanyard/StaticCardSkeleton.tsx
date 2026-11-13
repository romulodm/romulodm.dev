/**
 * Footprint of the mobile 3D card, shared by the loading state in Hero and by
 * StaticCardDisplay itself.
 *
 * The card used to change height three times while loading: the Hero
 * skeleton (340px), then StaticCardDisplay with nothing in flow until the
 * texture existed (only its padding, ~32px), then the 420x520 canvas. Every
 * change pushed the greeting panel below it, which was the page's whole CLS
 * (over 1.0 on mobile). Both states now render this same box, so the panel
 * sits in its final place from the first HTML.
 *
 * The box keeps the canvas aspect ratio but never exceeds the viewport minus
 * the hero's horizontal padding: at a fixed 420px the canvas was wider than a
 * 412px phone.
 *
 * Kept in its own file on purpose: Hero imports it statically, and importing
 * it from StaticCardDisplay would pull three.js into Hero's bundle.
 */
export const STATIC_CARD_BOX = 'relative aspect-[420/520] w-[min(420px,calc(100vw-2rem))]';

export function StaticCardPulse({ className = '' }: { className?: string }) {
    return (
        <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
            <div className="h-[240px] w-[180px] animate-pulse rounded-xl bg-black/20 dark:bg-white/10" />
        </div>
    );
}

export default function StaticCardSkeleton() {
    return (
        <div className="flex justify-center py-4">
            <div className={STATIC_CARD_BOX}>
                <StaticCardPulse />
            </div>
        </div>
    );
}
