"use client";

// components/wall/cards/ComposeCard.tsx

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AvatarCircle } from "../ui/AvatarCircle";
import { PublishModal } from "../PublishModal";
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
      <div
        className="relative rounded-2xl overflow-hidden flex flex-col h-[220px]
                   shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5
                   dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] dark:ring-0"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, #3b1f6e 0%, #1a0a3d 100%)",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <p
            className="type-h3 text-white"
          >
            {t("title")}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/20 active:bg-white/30
                       border border-white/20 rounded-lg px-4 py-2 text-white text-xs
                       font-medium transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
              />
            </svg>
            {t("cta")}
          </button>
        </div>

        <div>
          <svg viewBox="0 0 600 40" preserveAspectRatio="none" className="block h-6 w-full" aria-hidden>
            <path
              d="M0 25 Q 50 5 100 22 T 200 22 T 300 22 T 400 22 T 500 22 T 600 22 T 600 22 L600 40 L0 40 Z"
              className="fill-white dark:fill-[#141414]"
            />
          </svg>
          <div className="flex items-center justify-center gap-2 bg-white dark:bg-[#141414] px-4 pb-4 pt-2 -mt-0.5">
            <AvatarCircle user={user} size={35} />
            <span className="text-sm font-medium text-neutral-900 dark:text-white/90 truncate">
              {user.username}
            </span>
          </div>
        </div>
      </div>

      <PublishModal user={user} open={open} onOpenChange={setOpen} onPosted={onPosted} />
    </>
  );
}
