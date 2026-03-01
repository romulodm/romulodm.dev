"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthGuard } from "@/hooks/auth-guard";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Bold,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Code,
    FileCode,
} from "lucide-react";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { DeleteCommentModal } from "@/components/comments/DeleteCommentModal";

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

// ── Markdown rendered with the same unified pipeline as the blog ──────────────
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

    if (!html) {
        return (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {markdown}
            </p>
        );
    }
    return (
        <div
            className="prose prose-sm max-w-none
                prose-p:my-1 prose-p:leading-relaxed
                prose-headings:mt-3 prose-headings:mb-1
                prose-strong:font-semibold prose-strong:text-foreground
                prose-em:text-foreground/80
                prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
                prose-code:bg-accent prose-code:px-1 prose-code:rounded prose-code:text-xs
                prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-accent prose-pre:rounded-lg prose-pre:p-3 prose-pre:text-xs
                prose-blockquote:border-l-2 prose-blockquote:border-border
                prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

// ── Inline edit wrapper — reuses CommentComposer in "edit mode" ───────────────
interface InlineEditorProps {
    commentId: string;
    initialBody: string;
    postId: string;
    onSave: (newBody: string) => void;
    onCancel: () => void;
}

// ── Markdown preview — same unified pipeline as the blog ──────────────────────
// We do a lightweight inline import here (same as MarkdownPreview does)
async function renderToHtml(markdown: string): Promise<string> {
    const { unified } = await import("unified");
    const remarkParse = (await import("remark-parse")).default;
    const remarkGfm = (await import("remark-gfm")).default;
    const remarkRehype = (await import("remark-rehype")).default;
    const rehypeHighlight = (await import("rehype-highlight")).default;
    const rehypeStringify = (await import("rehype-stringify")).default;

    const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeHighlight)
        .use(rehypeStringify)
        .process(markdown);

    return result.toString();
}

function InlineEditor({ commentId, initialBody, postId, onSave, onCancel }: InlineEditorProps) {
    // We forward the save logic: CommentComposer calls onSuccess after POSTing.
    // Here we intercept via a custom wrapper that PATCHes instead.
    const [isPending, startTransition] = useTransition();
    const [body, setBody] = useState(initialBody);

    // We render our own simplified version that wraps CommentComposer's UI
    // but submits a PATCH instead of POST.
    // Since CommentComposer is tightly coupled to POST /api/comments,
    // we inline just the textarea + toolbar logic here for the edit case.
    // This avoids forking CommentComposer and keeps the UI identical.

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<"write" | "preview">("write");
    const [previewHtml, setPreviewHtml] = useState("");

    function insertMarkdown(before: string, after: string = "") {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = body.substring(start, end);
        const newBody = body.substring(0, start) + before + selected + after + body.substring(end);
        setBody(newBody);

        setTimeout(() => {
            textarea.focus();
            const cursor = start + before.length + selected.length;
            textarea.setSelectionRange(cursor, cursor);
        }, 0);
    }

    const tools: { icon: React.ElementType; label: string; action: () => void }[] = [
        { icon: Bold, label: "Negrito (Ctrl+B)", action: () => insertMarkdown("**", "**") },
        { icon: Italic, label: "Itálico (Ctrl+I)", action: () => insertMarkdown("*", "*") },
        { icon: LinkIcon, label: "Link", action: () => insertMarkdown("[", "](url)") },
        { icon: List, label: "Lista", action: () => insertMarkdown("\n- ", "") },
        { icon: ListOrdered, label: "Lista numerada", action: () => insertMarkdown("\n1. ", "") },
        { icon: Quote, label: "Citação", action: () => insertMarkdown("\n> ", "") },
        { icon: Code, label: "Código inline", action: () => insertMarkdown("`", "`") },
        { icon: FileCode, label: "Bloco de código", action: () => insertMarkdown("\n```\n", "\n```\n") },
    ];

    // ── Switch to preview tab ─────────────────────────────────────────────────
    async function handleTabChange(t: "write" | "preview") {
        setTab(t);
        if (t === "preview") {
            const html = await renderToHtml(body);
            setPreviewHtml(html);
        }
    }

    async function handleSave() {
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
        // We reuse CommentComposer's visual shell but control submission ourselves.
        // Pass a dummy postId and intercept via onSuccess—but since CommentComposer
        // always POSTs, we build the edit UI here with the same Tailwind classes.
        <div className="rounded-lg border border-border overflow-hidden bg-background mt-2">
            {/* Same toolbar as CommentComposer — import the component directly
                but with an "editMode" approach: we render our own textarea below
                and let the user know they're editing */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-accent/20">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                    Editando comentário
                </span>
            </div>

            <div className="flex border-b border-border px-2 pt-1">
                {(["write", "preview"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => handleTabChange(t)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors
                            ${tab === t
                                ? "border-b-2 border-foreground text-foreground -mb-px"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {t === "write" ? "Escrever" : "Pré-visualizar"}
                    </button>
                ))}
            </div>

            {tab === "write" && (
                <div className="flex gap-0.5 px-2 py-1.5 border-b border-border bg-gray-50 dark:bg-accent/20">
                    {tools.map((tool) => (
                        <button
                            key={tool.label}
                            type="button"
                            title={tool.label}
                            onClick={tool.action}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-accent transition-colors"
                        >
                            <tool.icon size={16} className="text-gray-700 dark:text-muted-foreground" />
                        </button>
                    ))}
                </div>
            )}

            {/* Reuse full CommentComposer with initialBody trick:
                We can't pass initialBody to CommentComposer directly since it
                doesn't accept it, so we use this wrapper textarea + the same
                Tailwind prose classes to stay visually identical. */}

            {tab === "write" ? (
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    maxLength={2000}
                    autoFocus
                    placeholder="Escreva seu comentário..."
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-mono resize-none
                    focus:outline-none placeholder:text-muted-foreground placeholder:font-sans"
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            handleSave();
                        }
                        if (e.key === "Escape") {
                            e.preventDefault();
                            onCancel();
                        }
                    }}
                />
            ) : (
                <div
                    className={`min-h-24 px-3 py-2.5 prose prose-sm max-w-none
                        prose-p:my-1 prose-headings:mt-3 prose-headings:mb-1
                        prose-code:bg-accent prose-code:px-1 prose-code:rounded prose-code:text-xs
                        prose-code:before:content-none prose-code:after:content-none
                        prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3
                        prose-blockquote:text-muted-foreground prose-blockquote:not-italic
                        prose-ul:my-1 prose-ol:my-1 prose-li:my-0`}
                    dangerouslySetInnerHTML={{
                        __html: previewHtml || '<span class="text-muted-foreground text-sm italic">Nada para pré-visualizar.</span>',
                    }}
                />
            )}

            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-accent/10">
                <span className={`text-xs tabular-nums
                    ${2000 - body.length < 50
                        ? "text-red-500"
                        : 2000 - body.length < 150
                            ? "text-orange-500"
                            : "text-muted-foreground"
                    }`}>
                    {(2000 - body.length).toLocaleString()} restantes
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        disabled={isPending}
                        className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending || !body.trim()}
                        className="px-4 py-1.5 rounded-md bg-foreground text-background text-sm font-medium
                            hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                Salvando…
                            </span>
                        ) : (
                            "Salvar edição"
                        )}
                    </button>
                </div>
            </div>
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

    // Vote state
    const [optimisticScore, setOptimisticScore] = useState(comment.score);
    const [optimisticVote, setOptimisticVote] = useState(comment.userVote ?? 0);
    const [isPending, startTransition] = useTransition();

    // UI state
    const [collapsed, setCollapsed] = useState(false);
    const [replying, setReplying] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [localBody, setLocalBody] = useState(comment.bodyMd);
    const [isEdited, setIsEdited] = useState(Boolean(comment.editedAt));

    // Delete modal state
    const [deleteOpen, setDeleteOpen] = useState(false);

    const isOwner = session?.user?.id === comment.author.id;
    const isAdmin = (session?.user as any)?.admin === true;
    const canEdit = isOwner;
    const canDelete = isOwner || isAdmin;

    const maxDepth = 5;
    const timeAgo = formatTimeAgo(new Date(comment.createdAt));
    const totalReplies = countReplies(comment);
    const scoreColor =
        optimisticScore > 0
            ? "text-orange-500"
            : optimisticScore < 0
                ? "text-blue-500"
                : "text-muted-foreground";

    // ── Delete ─────────────────────────────────────────────────────────────
    async function doDelete() {
        const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao apagar comentário.");
        toast.success("Comentário apagado.");
        onReplySuccess?.();
    }

    // ── Vote ───────────────────────────────────────────────────────────────
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

    // ── Share ──────────────────────────────────────────────────────────────
    async function handleShare() {
        const url = `${window.location.origin}/comments/${comment.id}`;
        const shareData = {
            title: `Comentário de @${comment.author.username}`,
            text: comment.bodyMd.slice(0, 100),
            url,
        };
        if (navigator.share && navigator.canShare?.(shareData)) {
            try { await navigator.share(shareData); return; }
            catch (e: any) { if (e.name === "AbortError") return; }
        }
        try { await navigator.clipboard.writeText(url); } catch (_) { }
        toast.success("Link copiado!", { description: url });
    }

    // ── Collapsed state ────────────────────────────────────────────────────
    if (collapsed) {
        return (
            <div className={`flex items-start gap-0
                ${depth > 0 ? "mt-2 -mb-1 border-t border-dashed pt-2 pl-[5px]" : ""}`}
            >
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1 py-1">
                    <button
                        onClick={() => setCollapsed(false)}
                        className="font-bold text-muted-foreground hover:text-green-600 transition-colors"
                    >
                        [+]
                    </button>
                    <Image
                        src={comment.author.image ?? "/default.png"}
                        alt={comment.author.username}
                        width={18} height={18}
                        className="rounded-full w-4 h-4 object-cover opacity-50 shrink-0"
                    />
                    <span>
                        <span className="font-medium text-foreground/60">
                            @{comment.author.username}
                        </span>
                        {" · "}{timeAgo}
                        {totalReplies > 0 && ` · ${totalReplies + 1} ocultos`}
                    </span>
                </div>
            </div>
        );
    }

    // ── Expanded ───────────────────────────────────────────────────────────
    return (
        <>
            {/* Delete confirmation modal — rendered at the top level of this card */}
            <DeleteCommentModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={doDelete}
                bodyPreview={localBody}
            />

            <div className={`flex items-start gap-0
                ${depth > 0 ? "mt-3 border-t border-dashed pt-3 pl-[5px]" : ""}`}
            >
                <div className="flex items-start gap-2 flex-1 min-w-0">

                    {/* ── LEFT COLUMN: avatar + vote + collapse bar ── */}
                    <div
                        className="flex flex-col items-center shrink-0 self-stretch"
                        style={{ width: 28 }}
                    >
                        {/* Avatar */}
                        <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                            <Image
                                src={comment.author.image ?? "/default.png"}
                                alt={comment.author.username}
                                width={28} height={28}
                                className="rounded-full w-7 h-7 object-cover ring-1 ring-border
                                    hover:opacity-80 transition-opacity"
                            />
                        </Link>

                        {/* Desktop vote — vertical under avatar */}
                        <div className="hidden sm:flex flex-col items-center mt-0.5">
                            <button
                                onClick={() => handleVote(1)}
                                disabled={isPending}
                                title="Upvote"
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                    ${optimisticVote === 1
                                        ? "text-orange-500"
                                        : "text-muted-foreground hover:text-orange-500"}`}
                            >
                                <svg className="w-3.5 h-3.5"
                                    fill={optimisticVote === 1 ? "currentColor" : "none"}
                                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            <span className={`text-xs font-mono font-semibold leading-none my-0.5 ${scoreColor}`}>
                                {optimisticScore}
                            </span>
                            <button
                                onClick={() => handleVote(-1)}
                                disabled={isPending}
                                title="Downvote"
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                    ${optimisticVote === -1
                                        ? "text-blue-500"
                                        : "text-muted-foreground hover:text-blue-500"}`}
                            >
                                <svg className="w-3.5 h-3.5"
                                    fill={optimisticVote === -1 ? "currentColor" : "none"}
                                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Collapse bar */}
                        <div
                            className="group/thread flex-1 flex flex-col items-center w-full cursor-pointer mt-1"
                            onClick={() => setCollapsed(true)}
                            title="Ocultar comentário"
                        >
                            <div className="flex-1 w-px bg-border/50 group-hover/thread:bg-red-400 transition-colors"
                                style={{ minHeight: 8 }} />
                            <div className="shrink-0 w-4 h-4 rounded-full border border-border bg-background
                                flex items-center justify-center
                                text-muted-foreground group-hover/thread:text-red-500 group-hover/thread:border-red-400
                                transition-colors text-[10px] font-bold leading-none select-none my-0.5">
                                −
                            </div>
                            <div className="flex-1 w-px bg-border/50 group-hover/thread:bg-red-400 transition-colors"
                                style={{ minHeight: 8 }} />
                        </div>
                    </div>

                    {/* ── CONTENT ── */}
                    <div className="flex-1 min-w-0 pb-2 pl-2">

                        {/* Context badge */}
                        {showContext && comment.post && (
                            <div className="mb-2">
                                <Link
                                    href={`/blog/${comment.post.slug}`}
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground
                                        hover:text-foreground transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                                               a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-medium text-foreground">
                                        {comment.post.title}
                                    </span>
                                </Link>
                            </div>
                        )}

                        {/* Author row */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Link
                                href={`/profile/${comment.author.username}`}
                                className="text-sm font-semibold hover:underline"
                            >
                                @{comment.author.username}
                            </Link>
                            <span className="text-muted-foreground text-xs">·</span>
                            <time className="text-xs text-muted-foreground">{timeAgo}</time>
                            {isEdited && (
                                <>
                                    <span className="text-muted-foreground text-xs">·</span>
                                    <span className="text-xs text-muted-foreground italic">editado</span>
                                </>
                            )}

                            {/* ⋯ actions menu */}
                            {(canEdit || canDelete) && !editing && (
                                <div className="relative ml-auto">
                                    <button
                                        onClick={() => setMenuOpen((o) => !o)}
                                        className="p-1.5 rounded hover:bg-accent text-muted-foreground
                                            hover:text-foreground transition-colors"
                                    >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>

                                    {menuOpen && (
                                        <>
                                            {/* Click-outside overlay */}
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setMenuOpen(false)}
                                            />
                                            <div className="absolute right-0 top-8 z-20 min-w-[130px]
                                                rounded-lg border border-border bg-background shadow-lg py-1">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => {
                                                            setEditing(true);
                                                            setMenuOpen(false);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs
                                                            hover:bg-accent transition-colors text-left"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                                        Editar
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => {
                                                            setDeleteOpen(true);
                                                            setMenuOpen(false);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs
                                                            text-red-500 hover:bg-accent transition-colors text-left"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Apagar
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
                                postId={postId}
                                onSave={(newBody) => {
                                    setLocalBody(newBody);
                                    setIsEdited(true);
                                    setEditing(false);
                                }}
                                onCancel={() => setEditing(false)}
                            />
                        ) : (
                            <CommentBody markdown={localBody} />
                        )}

                        {/* Actions bar — hidden while editing */}
                        {!editing && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {/* Mobile vote */}
                                <div className="flex sm:hidden items-center gap-0.5 mr-2">
                                    <button
                                        onClick={() => handleVote(1)}
                                        disabled={isPending}
                                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                            ${optimisticVote === 1
                                                ? "text-orange-500"
                                                : "text-muted-foreground hover:text-orange-500"}`}
                                    >
                                        <svg className="w-3.5 h-3.5"
                                            fill={optimisticVote === 1 ? "currentColor" : "none"}
                                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>
                                    <span className={`text-xs font-mono font-semibold min-w-[1.5ch] text-center ${scoreColor}`}>
                                        {optimisticScore}
                                    </span>
                                    <button
                                        onClick={() => handleVote(-1)}
                                        disabled={isPending}
                                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors
                                            ${optimisticVote === -1
                                                ? "text-blue-500"
                                                : "text-muted-foreground hover:text-blue-500"}`}
                                    >
                                        <svg className="w-3.5 h-3.5"
                                            fill={optimisticVote === -1 ? "currentColor" : "none"}
                                            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Reply */}
                                {depth < maxDepth && (
                                    <button
                                        onClick={() => guard(() => setReplying((r) => !r))}
                                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                                            ${replying
                                                ? "text-foreground bg-accent"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        Responder
                                    </button>
                                )}

                                {/* Share */}
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground
                                        hover:text-foreground hover:bg-accent rounded transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342
                                               m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316
                                               m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684
                                               zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Compartilhar
                                </button>
                            </div>
                        )}

                        {/* Reply composer */}
                        {replying && !editing && (
                            <div className="mt-3">
                                <CommentComposer
                                    postId={postId}
                                    parentId={comment.id}
                                    autoFocus
                                    onSuccess={() => {
                                        setReplying(false);
                                        onReplySuccess?.();
                                    }}
                                    onCancel={() => setReplying(false)}
                                />
                            </div>
                        )}

                        {/* Nested replies */}
                        {(comment.replies?.length ?? 0) > 0 && (
                            <>
                                {comment.replies!.map((reply) => (
                                    <CommentCard
                                        key={reply.id}
                                        comment={reply}
                                        postId={postId}
                                        depth={depth + 1}
                                        onReplySuccess={onReplySuccess}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
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