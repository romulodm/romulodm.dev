"use client";

import { useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuthGuard } from "@/hooks/auth-guard";
import { MessageCard } from "./cards/MessageCard";
import { ComposeCard } from "./cards/ComposeCard";
import { SignInCard } from "./cards/SignInCard";
import { AlreadyPostedCard } from "./cards/AlreadyPostedCard";
import type { WallMsg, WallAuthor } from "./utils";
import { AnimatedEmoji } from "@/components/ui/AnimatedEmoji";

export interface WallClientProps {
  initialMessages: WallMsg[];
  currentUser: WallAuthor | null;
  isAdmin: boolean;
  hasPosted: boolean;
  /** Total de recados no mural, não só os desta página. */
  total: number;
  page: number;
  totalPages: number;
}

export function WallClient({
  initialMessages,
  currentUser,
  isAdmin,
  hasPosted,
  total: initialTotal,
  page,
  totalPages,
}: WallClientProps) {
  const { guard } = useAuthGuard();
  const t = useTranslations("wall");

  const [messages, setMessages] = useState<WallMsg[]>(initialMessages);
  const [total, setTotal] = useState(initialTotal);
  const [posted, setPosted] = useState(hasPosted);

  // ── callbacks ───────────────────────────────────────────────────────────────

  const handlePosted = (msg: WallMsg) => {
    setMessages(prev => [msg, ...prev]);
    setTotal(n => n + 1);
    setPosted(true);
  };

  const handleDeleted = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    setTotal(n => Math.max(0, n - 1));
  }, []);

  // ── first-slot logic ─────────────────────────────────────────────────────────

  const firstCard = () => {
    if (!currentUser) return <SignInCard onSignIn={() => guard(() => { })} />;
    if (posted) return <AlreadyPostedCard user={currentUser} />;
    return <ComposeCard user={currentUser} onPosted={handlePosted} />;
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    // The page already wraps this in <main className="px-4 py-24">; a second
    // padded <main> here doubled the top spacing compared to /support.
    <div>
      {/* ── Header ── */}
      <header className="text-center mb-8">
        <h1 className="type-h1 text-foreground mb-2 flex items-center justify-center gap-3">
          {t("page.title")}
          <AnimatedEmoji code="270d_fe0f" />
        </h1>
        <p className="type-body text-muted-foreground max-w-md mx-auto">
          {t("page.description")}
        </p>
        {total > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {t.rich("page.count", {
              count: total,
              strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            })}
          </p>
        )}
      </header>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                      gap-x-3 gap-y-6 [&>*]:transition-all [&>*]:min-w-0">
        {/* First slot: compose / sign-in / already-posted. Only on page 1,
            where the newest messages (and a freshly posted one) live. */}
        {page === 1 && firstCard()}

        {messages.map(msg => (
          <MessageCard
            key={msg.id}
            msg={msg}
            canDelete={isAdmin || msg.author.id === currentUser?.id}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <nav
          aria-label={t("list.pagination")}
          className="flex flex-wrap items-center justify-center gap-1.5 mt-10 text-sm"
        >
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={PAGE_LINK}>
              {t("list.previous")}
            </Link>
          )}
          {pageWindow(page, totalPages).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground">…</span>
            ) : (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={p === page ? PAGE_LINK_ACTIVE : PAGE_LINK}
              >
                {p}
              </Link>
            ),
          )}
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className={PAGE_LINK}>
              {t("list.next")}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

const PAGE_LINK =
  "min-w-9 rounded-lg border border-border px-3 py-1.5 text-center text-muted-foreground " +
  "hover:text-foreground hover:border-foreground/30 transition-colors";
const PAGE_LINK_ACTIVE =
  "min-w-9 rounded-lg border border-foreground/40 px-3 py-1.5 text-center " +
  "text-foreground font-medium pointer-events-none";

function pageHref(p: number) {
  return p === 1 ? "/wall" : { pathname: "/wall", query: { page: String(p) } };
}

/**
 * First, last, and the current page with one neighbour on each side; `null`
 * marks a gap. 1 … 4 5 6 … 12
 */
function pageWindow(page: number, totalPages: number): (number | null)[] {
  const keep = new Set([1, totalPages, page - 1, page, page + 1]);
  const out: (number | null)[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (!keep.has(p)) continue;
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push(null);
    out.push(p);
  }
  return out;
}
