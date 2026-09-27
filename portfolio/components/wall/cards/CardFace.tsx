"use client";

// components/wall/cards/CardFace.tsx

import type { CSSProperties, ReactNode } from "react";
import type { CardArt } from "../cardArt";
import type { WallAuthor } from "../utils";
import { AvatarCircle } from "../ui/AvatarCircle";
import { CardShell } from "./CardShell";

interface Props {
  art: CardArt;
  message: string;
  author: WallAuthor;
  /** Second line of the footer, under the username (the post date). */
  caption: string;
  /** Buttons on the right of the footer (delete, share). */
  actions?: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * What a wall message looks like, and nothing else: art and text in the
 * panel, author footer below. The published card (MessageCard) and the
 * preview in the publish modal both render this, so what the visitor
 * approves in the modal is pixel for pixel what lands on the wall.
 */
export function CardFace({ art, message, author, caption, actions, id, className, style }: Props) {
  return (
    <CardShell
      id={id}
      className={className}
      style={style}
      panelStyle={{
        backgroundColor: "#141414",
        backgroundImage: `url("${art.dataUri}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      panel={
        <div className="flex flex-1 min-w-0 items-center justify-center px-5 py-6">
          <p
            className="w-full max-w-full text-center text-base font-semibold leading-snug
                       data-[ink=light]:drop-shadow-sm
                       whitespace-pre-wrap break-words [overflow-wrap:anywhere] hyphens-auto"
            // Ink comes from the art: white on dark grounds, near-black on the
            // pastel palettes. Only white text gets the drop shadow; a shadow
            // under dark text on a light ground reads as a blur.
            data-ink={art.ink === "#ffffff" ? "light" : "dark"}
            style={{ color: art.ink }}
          >
            {message}
          </p>
        </div>
      }
      footer={
        <div className="flex w-full min-w-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AvatarCircle user={author} size={35} />
            <div className="leading-tight min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white/90 truncate">
                {author.username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-white/45">{caption}</p>
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      }
    />
  );
}
