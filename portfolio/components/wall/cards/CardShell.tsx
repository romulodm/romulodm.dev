// components/wall/cards/CardShell.tsx

import type { CSSProperties, ReactNode } from "react";
import { CARD_ART_ASPECT } from "../cardArt";

interface Props {
  /** Background of the art panel (the generated art). Optional: the invite
   *  cards draw their backdrop as a layer inside `panel` instead. */
  panelStyle?: CSSProperties;
  /** What sits on top of the art: the message, or the invite copy. */
  panel: ReactNode;
  /** The strip under the panel: author, date, actions. */
  footer: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The shape every slot of the wall shares, taken from the guestbook tile of
 * the home bento: a framed card with the art in an inset rounded panel on
 * top and the author strip underneath. The panel is not overlapped by
 * anything, so the generated art is shown whole (the old wave divider
 * covered its bottom edge).
 *
 * Grid rows stretch their items, and the panel is the part that grows, so
 * cards in the same row keep their footers aligned whatever the text length.
 */
export function CardShell({ panelStyle, panel, footer, id, className = "", style }: Props) {
  return (
    <article
      id={id}
      className={`flex w-full min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-card p-2
                  shadow-[0_10px_30px_-14px_rgba(0,0,0,0.2)]
                  dark:shadow-[0_10px_40px_-14px_rgba(0,0,0,0.6)] ${className}`}
      style={style}
    >
      {/* Sized by the art's own ratio, so the art is never cropped at rest.
          It still grows for a long message or a taller card in the same grid
          row. No overflow-hidden here on purpose: it switches off the
          automatic minimum height of aspect-ratio boxes and a long message
          would be cut instead of growing the panel. The background already
          follows the rounded corners without it. */}
      <div
        className="relative flex flex-1 flex-col rounded-xl"
        style={{ aspectRatio: CARD_ART_ASPECT, ...panelStyle }}
      >
        {panel}
      </div>
      <div className="flex min-h-10 w-full min-w-0 items-center px-2 pb-1">{footer}</div>
    </article>
  );
}
