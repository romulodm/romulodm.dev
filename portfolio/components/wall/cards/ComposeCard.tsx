"use client";

// components/wall/cards/ComposeCard.tsx

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AvatarCircle } from "../ui/AvatarCircle";
import { PublishModal } from "../PublishModal";
import { CardShell } from "./CardShell";
import { INVITE_BUTTON, INVITE_TEXT_SHADOW, InviteBackdrop } from "./invitePanel";
import type { WallAuthor, WallMsg } from "../utils";

interface Props {
  user: WallAuthor;
  onPosted: (msg: WallMsg) => void;
}

/**
 * First slot of the wall for a signed-in visitor who has not posted yet.
 * Writing happens in PublishModal; this card only invites and opens it.
 */
export function ComposeCard({ user, onPosted }: Props) {
  const t = useTranslations("wall.compose");
  const [open, setOpen] = useState(false);

  return (
    <>
      <CardShell
        panel={
          <>
            <InviteBackdrop />
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 px-6">
              <p className="type-h3 text-white text-center" style={INVITE_TEXT_SHADOW}>
                {t("title")}
              </p>
              <button type="button" onClick={() => setOpen(true)} className={INVITE_BUTTON}>
                <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                    stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
                  />
                </svg>
                {t("cta")}
              </button>
            </div>
          </>
        }
        footer={
          <div className="flex w-full min-w-0 items-center justify-center gap-2">
            <AvatarCircle user={user} size={35} />
            <span className="text-sm font-medium text-neutral-900 dark:text-white/90 truncate">
              {user.username}
            </span>
          </div>
        }
      />

      <PublishModal user={user} open={open} onOpenChange={setOpen} onPosted={onPosted} />
    </>
  );
}
