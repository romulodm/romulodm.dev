"use client";

import { useState, useCallback } from "react";
import { useAuthGuard } from "@/hooks/auth-guard";
import { MessageCard } from "./cards/MessageCard";
import { ComposeCard } from "./cards/ComposeCard";
import { SignInCard } from "./cards/SignInCard";
import { AlreadyPostedCard } from "./cards/AlreadyPostedCard";
import type { WallMsg, WallAuthor } from "./utils";

export interface WallClientProps {
  initialMessages: WallMsg[];
  currentUser: WallAuthor | null;
  isAdmin: boolean;
  hasPosted: boolean;
}

export function WallClient({
  initialMessages,
  currentUser,
  isAdmin,
  hasPosted,
}: WallClientProps) {
  const { guard } = useAuthGuard();

  const [messages, setMessages] = useState<WallMsg[]>(initialMessages);
  const [cursor, setCursor] = useState<string | null>(
    initialMessages.length >= 21 ? initialMessages[initialMessages.length - 1].id : null,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [posted, setPosted] = useState(hasPosted);

  // ── callbacks ───────────────────────────────────────────────────────────────

  const handlePosted = (msg: WallMsg) => {
    setMessages(prev => [msg, ...prev]);
    setPosted(true);
  };

  const handleDeleted = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/wall?cursor=${cursor}`);
      const data = await res.json();
      setMessages(prev => [...prev, ...data.messages]);
      setCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  // ── first-slot logic ─────────────────────────────────────────────────────────

  const firstCard = () => {
    if (!currentUser) return <SignInCard onSignIn={() => guard(() => { })} />;
    if (posted) return <AlreadyPostedCard user={currentUser} />;
    return <ComposeCard user={currentUser} onPosted={handlePosted} />;
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <main
      className="min-h-screen mx-auto px-4 py-24"
    >
      {/* ── Header ── */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">The wall remembers</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Words that echo through time, leaving a mark here. Share your thoughts, memories, or just say hi!
        </p>
      </header>

      {/* ── Grid ──
           • Cards are intentionally tilted via CSS transform in MessageCard.
           • We add overflow-visible + padding so the tilt shadow isn't clipped.
      */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                      gap-x-3 gap-y-6 [&>*]:transition-all [&>*]:min-w-0">
        {/* First slot: compose / sign-in / already-posted */}
        {firstCard()}

        {messages.map(msg => (
          <MessageCard
            key={msg.id}
            msg={msg}
            canDelete={isAdmin || msg.author.id === currentUser?.id}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {/* ── Load more ── */}
      {cursor && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="border border-white/15 hover:border-white/30 text-white/40
                       hover:text-white/70 rounded-xl px-6 py-2.5 text-sm
                       transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor"
                    strokeWidth="2" strokeDasharray="20 40" />
                </svg>
                Loading…
              </span>
            ) : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}
