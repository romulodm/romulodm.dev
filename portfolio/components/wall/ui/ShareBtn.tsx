// components/wall/ui/ShareBtn.tsx
"use client";
import { useState } from "react";

export function ShareBtn({ msgId }: { msgId: string }) {
  const [ok, setOk] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/wall#${msgId}`);
    setOk(true);
    setTimeout(() => setOk(false), 1800);
  };

  return (
    <button
      onClick={copy}
      title="Copy link"
      className="text-neutral-400 hover:text-neutral-700 dark:text-white/30 dark:hover:text-white/70 transition-colors p-0.5"
    >
      {ok ? (
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <circle cx="12" cy="3"  r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="4"  cy="8"  r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="13" r="1.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5.7 9l4.7 2.5M10.4 4.5L5.7 7" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )}
    </button>
  );
}
