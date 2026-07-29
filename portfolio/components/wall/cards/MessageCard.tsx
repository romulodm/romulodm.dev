"use client";

// components/wall/cards/MessageCard.tsx

import { THEMES } from "../themes";
import { formatDate, getRotation, type WallMsg } from "../utils";
import { AvatarCircle } from "../ui/AvatarCircle";
import { ShareBtn } from "../ui/ShareBtn";
import { DeleteBtn } from "../ui/DeleteBtn";

interface Props {
  msg: WallMsg;
  canDelete: boolean;
  onDeleted: (id: string) => void;
}

export function MessageCard({ msg, canDelete, onDeleted }: Props) {
  const theme = THEMES[msg.theme % THEMES.length];
  const rotation = getRotation(msg.id);

  return (
    <article
      id={msg.id}
      className="relative w-full min-w-0 rounded-2xl overflow-hidden
                 flex flex-col min-h-[220px]
                 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]
                 transition-transform duration-300
                 hover:scale-[1.02] hover:z-10 cursor-default"
      style={{
        background: theme.gradient,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Message body */}
      <div className="flex flex-1 min-w-0 items-center justify-center px-6 py-8">
        <p
          className="w-full max-w-full text-center text-[16px] font-semibold leading-snug
                     text-white drop-shadow-sm
                     whitespace-pre-wrap break-words [overflow-wrap:anywhere] hyphens-auto"
          style={{ fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}
        >
          {msg.message}
        </p>
      </div>

      {/* Wave + footer in normal flow */}
      <div className="w-full min-w-0 shrink-0">
        <svg
          viewBox="0 0 600 40"
          preserveAspectRatio="none"
          className="block h-6 w-full"
          aria-hidden
        >
          <path
            d="M0 25 Q 50 5 100 22 T 200 22 T 300 22 T 400 22 T 500 22 T 600 22 T 600 22 L600 40 L0 40 Z"
            fill="#141414"
          />
        </svg>

        <div className="flex w-full min-w-0 items-center justify-between gap-3
                        bg-[#141414] px-4 border-0 pb-4 pt-2 -mt-0.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AvatarCircle
              username={msg.author.username}
              image={msg.author.image}
              size={35}
              bg={theme.avatarBg}
            />
            <div className="leading-tight min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">
                {msg.author.username}
              </p>
              <p className="text-xs text-white/45">{formatDate(msg.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canDelete && <DeleteBtn msgId={msg.id} onDeleted={onDeleted} />}
            <ShareBtn msgId={msg.id} />
          </div>
        </div>
      </div>
    </article>
  );
}