"use client";

// components/wall/cards/ComposeCard.tsx

import { useState } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { Wave } from "../ui/Wave";
import { AvatarCircle } from "../ui/AvatarCircle";
import type { WallAuthor, WallMsg } from "../utils";

interface Props {
  user: WallAuthor;
  onPosted: (msg: WallMsg) => void;
}

const MAX = 100;

// Pencil icon (outline)
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
      <path
        d="M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
    </svg>
  );
}

// Arrow-right icon
function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComposeCard({ user, onPosted }: Props) {
  const t = useTranslations("wall.compose");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (res.status === 409) { toast.error(t("alreadyPosted")); return; }
      if (!res.ok) { toast.error(t("error")); return; }

      const created: WallMsg = await res.json();
      onPosted(created);
      setText("");
      toast.success(t("success"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col h-[220px]
                 border border-white/10 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #a855f722 0%, transparent 55%), linear-gradient(180deg, #3b1f6e 0%, #1a0a3d 100%)",
      }}
    >
      {/* Spinning deco — top right */}
      <div className="absolute top-3.5 right-3.5 opacity-35 pointer-events-none">
        <svg
          className="w-6 h-6 animate-spin [animation-duration:3s]"
          viewBox="0 0 24 24" fill="none"
        >
          <circle
            cx="12" cy="12" r="9"
            stroke="white" strokeWidth="1.5"
            strokeDasharray="12 44" strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-4 pt-3 pb-1 relative z-10">
        {/* Header row: avatar + name + status */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <AvatarCircle username={user.username} image={user.image} size={26} bg="#7c3aed" />
          <div className="leading-tight">
            <p className="text-white text-[12px] font-bold leading-none">{user.username}</p>
            <p className="text-violet-300/80 text-[10px] mt-0.5 leading-none">
              {t("composing")}
            </p>
          </div>
        </div>

        {/* Textarea — dashed border matching the image */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder={t("placeholder")}
          rows={3}
          className="flex-1 w-full rounded-lg text-white/90 text-[12px]
                     placeholder-white/20 resize-none px-3 py-2
                     focus:outline-none transition-colors bg-transparent
                     border border-dashed border-white/20
                     focus:border-white/35"
        />
      </div>

      {/* Wave */}
      <Wave />

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[48px] bg-[#0b0b10]
                   flex items-center justify-between px-4 z-10"
      >
        {/* Pencil icon + char count */}
        <div className="flex items-center gap-2">
          <PencilIcon className="w-3.5 h-3.5 text-white/25" />
          <span className="text-white/30 text-[10px] tabular-nums">
            {text.length} / {MAX}
          </span>
        </div>

        {/* Send button */}
        <button
          onClick={submit}
          disabled={!text.trim() || loading}
          className="bg-white/10 hover:bg-white/20 active:bg-white/25
                     disabled:opacity-35 border border-white/15
                     text-white rounded-lg w-8 h-7
                     flex items-center justify-center
                     transition-all duration-150"
          aria-label="Post message"
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12" cy="12" r="9"
                stroke="white" strokeWidth="2" strokeDasharray="20 40"
              />
            </svg>
          ) : (
            <ArrowIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}