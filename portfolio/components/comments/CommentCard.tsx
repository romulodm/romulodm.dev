"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthGuard } from "@/hooks/auth-guard";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { DeleteCommentModal } from "@/components/comments/DeleteCommentModal";
import { MarkdownEditor } from "@/components/comments/MarkdownEditor";

export type CommentData = {
    id: string;
    bodyMd: string;
    score: number;
    createdAt: Date;
    editedAt?: Date | null;
    author: { id: string; username: string; image: string | null };
    userVote?: number;
    replies?: CommentData[];
    post?: { slug: string; title: string };
};

interface CommentCardProps {
    comment: CommentData;
    postId: string;
    depth?: number;
    onReplySuccess?: () => void;
    showContext?: boolean;
}

// ── Markdown body renderer ────────────────────────────────────────────────────
function CommentBody({ markdown }: { markdown: string }) {
    const [html, setHtml] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function render() {
            const { unified } = await import("unified");
            const remarkParse = (await import("remark-parse")).default;
            const remarkGfm = (await import("remark-gfm")).default;
            const remarkRehype = (await import("remark-rehype")).default;
            const rehypeHighlight = (await import("rehype-highlight")).default;
            const rehypeStringify = (await import("rehype-stringify")).default;
            const result = await unified()
                .use(remarkParse).use(remarkGfm).use(remarkRehype)
                .use(rehypeHighlight).use(rehypeStringify)
                .process(markdown);
            if (!cancelled) setHtml(result.toString());
        }
        render();
        return () => { cancelled = true; };
    }, [markdown]);

    // Fallback while HTML is being rendered — use text-foreground (not /90 opacity)
    // so it's visible in dark mode too
    if (!html) {
        return (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {markdown}
            </p>
        );
    }

    return (
        <div
            className="prose prose-sm dark:prose-invert max-w-none
                prose-p:my-1 prose-p:leading-relaxed prose-p:text-foreground
                prose-headings:mt-3 prose-headings:mb-1 prose-headings:text-foreground
                prose-strong:font-semibold prose-strong:text-foreground
                prose-em:text-foreground/80
                prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
                prose-code:bg-accent prose-code:text-foreground prose-code:px-1 prose-code:rounded prose-code:text-xs
                prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-accent prose-pre:rounded-lg prose-pre:p-3 prose-pre:text-xs
                prose-blockquote:border-l-2 prose-blockquote:border-border
                prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-li:text-foreground"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

// ── Inline editor — wraps MarkdownEditor for PATCH submission ─────────────────
interface InlineEditorProps {
    commentId: string;
    initialBody: string;
    onSave: (newBody: string) => void;
    onCancel: () => void;
}

function InlineEditor({ commentId, initialBody, onSave, onCancel }: InlineEditorProps) {
    const [body, setBody] = useState(initialBody);
    const [isPending, startTransition] = useTransition();

    function handleSave() {
        const trimmed = body.trim();
        if (!trimmed) return;
        startTransition(async () => {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bodyMd: trimmed }),
            });
            if (res.ok) {
                toast.success("Comentário atualizado.");
                onSave(trimmed);
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error ?? "Erro ao editar comentário.");
            }
        });
    }

    return (
        <div className="mt-2">
            <MarkdownEditor
                value={body}
                onChange={setBody}
                onSubmit={handleSave}
                onCancel={onCancel}
                autoFocus
                rows={6}
                submitLabel="Salvar edição"
                isPending={isPending}
                headerLabel={
                    <span className="flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        Editando comentário
                    </span>
                }
            />
        </div>
    );
}

// ── Main CommentCard ──────────────────────────────────────────────────────────
export function CommentCard({
    comment,
    postId,
    depth = 0,
    onReplySuccess,
    showContext = false,
}: CommentCardProps) {
    const { guard } = useAuthGuard();
    const { data: session } = useSession();

    const [optimisticScore, setOptimisticScore] = useState(comment.score);
    const [optimisticVote, setOptimisticVote] = useState(comment.userVote ?? 0);
    const [isPending, startTransition] = useTransition();

    const [collapsed, setCollapsed] = useState(false);
    const [replying, setReplying] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const [editing, setEditing] = useState(false);
    const [localBody, setLocalBody] = useState(comment.bodyMd);
    const [isEdited, setIsEdited] = useState(Boolean(comment.editedAt));
    const [deleteOpen, setDeleteOpen] = useState(false);

    const isOwner = session?.user?.id === comment.author.id;
    const isAdmin = (session?.user as any)?.admin === true;
    const canEdit = isOwner;
    const canDelete = isOwner || isAdmin;

    const maxDepth = 5;
    const timeAgo = formatTimeAgo(new Date(comment.createdAt));
    const totalReplies = countReplies(comment);
    const scoreColor =
        optimisticScore > 0 ? "text-primary"
            : optimisticScore < 0 ? "text-blue-500"
                : "text-muted-foreground";

    async function doDelete() {
        const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao apagar comentário.");
        toast.success("Comentário apagado.");
        onReplySuccess?.();
    }

    function handleVote(value: 1 | -1) {
        guard(async () => {
            const newVote = optimisticVote === value ? 0 : value;
            const delta = newVote - optimisticVote;
            setOptimisticScore((s) => s + delta);
            setOptimisticVote(newVote);
            startTransition(async () => {
                try {
                    const res = await fetch(`/api/comments/${comment.id}/vote`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ value: newVote }),
                    });
                    if (!res.ok) {
                        setOptimisticScore((s) => s - delta);
                        setOptimisticVote(optimisticVote);
                    }
                } catch {
                    setOptimisticScore((s) => s - delta);
                    setOptimisticVote(optimisticVote);
                }
            });
        });
    }

    async function handleShare() {
        const url = `${window.location.origin}/comments/${comment.id}`;
        const shareData = { title: `Comentário de @${comment.author.username}`, text: comment.bodyMd.slice(0, 100), url };
        if (navigator.share && navigator.canShare?.(shareData)) {
            try { await navigator.share(shareData); return; } catch (e: any) { if (e.name === "AbortError") return; }
        }
        try { await navigator.clipboard.writeText(url); } catch (_) { }
        toast.success("Link copiado!", { description: url });
    }

    if (collapsed) {
        return (
            <div className={`flex items-start gap-0 ${depth > 0 ? "mt-2 -mb-1 border border-border py-2 pl-[5px]" : ""}`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1 py-1">
                    <button onClick={() => setCollapsed(false)} className="font-bold text-muted-foreground hover:text-green-600 transition-colors">[+]</button>
                    <Image src={comment.author.image ?? "/default.png"} alt={comment.author.username} width={18} height={18} className="rounded-full w-4 h-4 object-cover opacity-50 shrink-0" />
                    <span>
                        <span className="font-medium text-foreground/60">@{comment.author.username}</span>
                        {" · "}{timeAgo}
                        {totalReplies > 0 && ` · ${totalReplies + 1} ocultos`}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <>
            <DeleteCommentModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={doDelete} bodyPreview={localBody} />

            <div className={`flex items-start gap-0 ${depth > 0 ? "mt-3 border-t border-border pt-3 pl-[5px]" : ""}`}>
                <div className="flex items-start gap-2 flex-1 min-w-0">

                    {/* LEFT: avatar + vote + collapse bar */}
                    <div className="flex flex-col items-center shrink-0 self-stretch" style={{ width: 28 }}>
                        <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                            <Image src={comment.author.image ?? "/default.png"} alt={comment.author.username} width={28} height={28}
                                className="rounded-full w-7 h-7 object-cover ring-1 ring-border hover:opacity-80 transition-opacity" />
                        </Link>

                        {/* Desktop vote */}
                        <div className="hidden sm:flex flex-col items-center mt-0.5">
                            <VoteButton
                                direction="up"
                                active={optimisticVote === 1}
                                disabled={isPending}
                                onClick={() => handleVote(1)}
                            />
                            <span className={`text-xs font-mono font-semibold leading-none my-0.5 ${scoreColor}`}>
                                {optimisticScore}
                            </span>
                            <VoteButton
                                direction="down"
                                active={optimisticVote === -1}
                                disabled={isPending}
                                onClick={() => handleVote(-1)}
                            />
                        </div>

                        {/* Collapse bar */}
                        <div className="group/thread flex-1 flex flex-col items-center w-full cursor-pointer mt-1" onClick={() => setCollapsed(true)} title="Ocultar comentário">
                            <div className="flex-1 w-px bg-border/50 group-hover/thread:bg-red-400 transition-colors" style={{ minHeight: 8 }} />
                            <div className="shrink-0 w-4 h-4 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground group-hover/thread:text-red-500 group-hover/thread:border-red-400 transition-colors text-[10px] font-bold leading-none select-none my-0.5">−</div>
                            <div className="flex-1 w-px bg-border/50 group-hover/thread:bg-red-400 transition-colors" style={{ minHeight: 8 }} />
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0 pb-2 sm:pl-1">
                        {showContext && comment.post && (
                            <div className="mb-2">
                                <Link href={`/blog/${comment.post.slug}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="font-medium text-foreground">{comment.post.title}</span>
                                </Link>
                            </div>
                        )}

                        {/* Author row */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Link href={`/profile/${comment.author.username}`} className="text-sm font-semibold hover:underline">@{comment.author.username}</Link>
                            <span className="text-muted-foreground text-xs">·</span>
                            <time className="text-xs text-muted-foreground">{timeAgo}</time>
                            {isEdited && (
                                <>
                                    <span className="text-muted-foreground text-xs">·</span>
                                    <span className="text-xs text-muted-foreground italic">editado</span>
                                </>
                            )}

                            {/* Actions menu */}
                            {(canEdit || canDelete) && !editing && (
                                <div className="relative ml-auto">
                                    <button onClick={() => setMenuOpen((o) => !o)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                    {menuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                            <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border border-border bg-background shadow-lg py-1">
                                                {canEdit && (
                                                    <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-left">
                                                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" /> Editar
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => { setDeleteOpen(true); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-accent transition-colors text-left">
                                                        <Trash2 className="w-3.5 h-3.5" /> Apagar
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Body or Inline Editor */}
                        {editing ? (
                            <InlineEditor
                                commentId={comment.id}
                                initialBody={localBody}
                                onSave={(newBody) => { setLocalBody(newBody); setIsEdited(true); setEditing(false); }}
                                onCancel={() => setEditing(false)}
                            />
                        ) : (
                            <CommentBody markdown={localBody} />
                        )}

                        {/* Actions bar */}
                        {!editing && (
                            <div className="flex items-center sm:gap-1 mt-2 flex-wrap">
                                {/* Mobile vote */}
                                <div className="flex sm:hidden items-center gap-0.5 mr-2">
                                    <VoteButton
                                        direction="up"
                                        active={optimisticVote === 1}
                                        disabled={isPending}
                                        onClick={() => handleVote(1)}
                                    />
                                    <span className={`text-xs font-mono font-semibold min-w-[1.5ch] text-center ${scoreColor}`}>
                                        {optimisticScore}
                                    </span>
                                    <VoteButton
                                        direction="down"
                                        active={optimisticVote === -1}
                                        disabled={isPending}
                                        onClick={() => handleVote(-1)}
                                    />
                                </div>

                                {depth < maxDepth && (
                                    <button onClick={() => guard(() => setReplying((r) => !r))} className={`flex items-center gap-1 sm:px-2 py-1 text-xs rounded transition-colors ${replying ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-border"}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                        Responder
                                    </button>
                                )}

                                <button onClick={handleShare} className="flex items-center gap-1 pl-2 sm:px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-border rounded transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                    Compartilhar
                                </button>
                            </div>
                        )}

                        {replying && !editing && (
                            <div className="mt-3">
                                <CommentComposer postId={postId} parentId={comment.id} autoFocus
                                    onSuccess={() => { setReplying(false); onReplySuccess?.(); }}
                                    onCancel={() => setReplying(false)} />
                            </div>
                        )}

                        {(comment.replies?.length ?? 0) > 0 && (
                            <>
                                {comment.replies!.map((reply) => (
                                    <CommentCard key={reply.id} comment={reply} postId={postId} depth={depth + 1} onReplySuccess={onReplySuccess} />
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Small shared vote button ──────────────────────────────────────────────────
function VoteButton({ direction, active, disabled, onClick }: { direction: "up" | "down"; active: boolean; disabled: boolean; onClick: () => void }) {
    const activeColor = direction === "up" ? "text-primary" : "text-blue-500";
    const hoverColor = direction === "up" ? "hover:text-primary" : "hover:text-blue-500";
    const path = direction === "up" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
    return (
        <button onClick={onClick} disabled={disabled} title={direction === "up" ? "Upvote" : "Downvote"}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${active ? activeColor : `text-muted-foreground ${hoverColor}`}`}>
            <svg className="w-3.5 h-3.5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={path} />
            </svg>
        </button>
    );
}

function countReplies(c: CommentData): number {
    if (!c.replies?.length) return 0;
    return c.replies.length + c.replies.reduce((acc, r) => acc + countReplies(r), 0);
}

function formatTimeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h atrás`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} dias atrás`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}