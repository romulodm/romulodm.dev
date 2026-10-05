"use client";

import { useTranslations } from "next-intl";

import { CommentBody } from "@/components/comments/CommentBody";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AvatarUser } from "@/lib/avatar";

interface CommentPreviewProps {
  markdown: string;
  /** Null while the session token still lacks avatar fields; falls back to an initial. */
  author: AvatarUser | null;
  username: string;
  score?: number;
  edited?: boolean;
}

/**
 * Static replica of CommentCard used by the editor's preview tab, so the author
 * sees the comment exactly as it will appear in the thread. Nothing here is
 * interactive: no votes, menu, collapse, reply or share. It is a separate
 * component (and not CommentCard with a flag) because CommentCard imports
 * CommentComposer, which would make the import cycle CommentCard → Composer →
 * CommentCard. If CommentCard's layout changes, mirror it here.
 */
export function CommentPreview({ markdown, author, username, score = 0, edited = false }: CommentPreviewProps) {
  const t = useTranslations("commentsUi.card");
  const scoreColor = score > 0 ? "text-primary" : "text-muted-foreground";

  return (
    <div className="flex items-start gap-2 pointer-events-none select-text">
      <div className="flex flex-col items-center shrink-0 self-stretch" style={{ width: 28 }}>
        {author ? (
          <UserAvatar user={author} size={28} className="ring-1 ring-border" />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold uppercase text-primary">
            {username.charAt(0)}
          </span>
        )}

        <div className="hidden sm:flex flex-col items-center mt-0.5">
          <StaticVote direction="up" />
          <span className={`text-xs font-mono font-semibold leading-none my-0.5 ${scoreColor}`}>{score}</span>
          <StaticVote direction="down" />
        </div>

        <div className="flex-1 flex flex-col items-center w-full mt-1">
          <div className="flex-1 w-px bg-border/50" style={{ minHeight: 8 }} />
          <div className="shrink-0 w-4 h-4 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground text-xs font-bold leading-none select-none my-0.5">-</div>
          <div className="flex-1 w-px bg-border/50" style={{ minHeight: 8 }} />
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-2 sm:pl-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-sm font-semibold">@{username}</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground">{t("time.now")}</span>
          {edited && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground italic">{t("edited")}</span>
            </>
          )}
        </div>

        <CommentBody markdown={markdown} />

        <div className="flex items-center sm:gap-1 mt-2 flex-wrap text-xs text-muted-foreground">
          <div className="flex sm:hidden items-center gap-0.5 mr-2">
            <StaticVote direction="up" />
            <span className={`font-mono font-semibold min-w-[1.5ch] text-center ${scoreColor}`}>{score}</span>
            <StaticVote direction="down" />
          </div>
          <span className="flex items-center gap-1 sm:px-2 py-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            {t("reply")}
          </span>
          <span className="flex items-center gap-1 pl-2 sm:px-2 py-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            {t("share")}
          </span>
        </div>
      </div>
    </div>
  );
}

function StaticVote({ direction }: { direction: "up" | "down" }) {
  const path = direction === "up" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
  return (
    <span className="w-6 h-6 flex items-center justify-center text-muted-foreground">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </span>
  );
}
