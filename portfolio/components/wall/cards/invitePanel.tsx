// components/wall/cards/invitePanel.tsx

import Image from "next/image";
import type { CSSProperties } from "react";
import duskValley from "@/public/newsletter/dusk-wall.webp";

/**
 * Backdrop of the first slot (sign in, compose, already posted): the same
 * pixel-art dusk valley as the newsletter hero, with the same treatment so
 * white copy stays readable over the pink horizon and the lit hills.
 *
 * Clips itself to the panel's corners: the panel cannot use overflow-hidden
 * (see CardShell), so the rounding has to live on this layer.
 */
export function InviteBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden>
      <Image
        src={duskValley}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        placeholder="blur"
        className="object-cover object-bottom"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/55" />
      {/* Extra shade right behind the copy, like nl-hero-focus on the
          newsletter: a uniform overlay dark enough for the text would kill
          the image. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_50%,rgba(0,0,0,0.45),transparent)]" />
    </div>
  );
}

/** Same stack of shadows as the newsletter hero copy. */
export const INVITE_TEXT_SHADOW: CSSProperties = {
  textShadow: "0 1px 2px rgba(0,0,0,0.6), 0 2px 16px rgba(0,0,0,0.45)",
};

/**
 * Buttons on the backdrop get their own dark backing, like the newsletter
 * sign-up field: a translucent white pill vanishes over the bright river.
 */
export const INVITE_BUTTON =
  "flex items-center gap-2 rounded-lg border border-white/15 bg-black/55 px-4 py-2 text-xs font-medium " +
  "text-white backdrop-blur-md transition-colors duration-150 hover:bg-black/70 active:bg-black/80 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
