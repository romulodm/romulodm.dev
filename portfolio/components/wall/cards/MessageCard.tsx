"use client";

// components/wall/cards/MessageCard.tsx

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  DEFAULT_CARD_ART_STYLE,
  DEFAULT_CARD_ART_TONE,
  generateCardArt,
  isCardArtStyle,
  isCardArtTone,
  wallCardSeed,
} from "../cardArt";
import { formatDate, type WallMsg } from "../utils";
import { CardFace } from "./CardFace";
import { ShareBtn } from "../ui/ShareBtn";
import { DeleteBtn } from "../ui/DeleteBtn";

interface Props {
  msg: WallMsg;
  canDelete: boolean;
  onDeleted: (id: string) => void;
}

export function MessageCard({ msg, canDelete, onDeleted }: Props) {
  const locale = useLocale();
  const art = useMemo(
    () =>
      generateCardArt(
        wallCardSeed(msg.author.id, msg.message),
        // The columns are plain strings. A style retired after the message
        // was posted renders with the default instead of breaking the wall.
        isCardArtStyle(msg.artStyle) ? msg.artStyle : DEFAULT_CARD_ART_STYLE,
        isCardArtTone(msg.artTone) ? msg.artTone : DEFAULT_CARD_ART_TONE,
      ),
    [msg.author.id, msg.message, msg.artStyle, msg.artTone],
  );

  return (
    <CardFace
      id={msg.id}
      art={art}
      message={msg.message}
      author={msg.author}
      caption={formatDate(msg.createdAt, locale)}
      className="transition-transform duration-300 hover:scale-[1.02] hover:z-10 cursor-default"
      actions={
        <>
          {canDelete && <DeleteBtn msgId={msg.id} onDeleted={onDeleted} />}
          <ShareBtn msgId={msg.id} />
        </>
      }
    />
  );
}
