"use client";

import { useState, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useAuthGuard } from "@/hooks/auth-guard";
import { toast } from "sonner";
import {
    Bold,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Code,
    FileCode,
} from "lucide-react";

interface CommentComposerProps {
    postId: string;
    parentId?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
}

const MAX = 2000;

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

export function CommentComposer({
    postId,
    parentId = null,
    onSuccess,
    onCancel,
    autoFocus = false,
}: CommentComposerProps) {
    const { data: session } = useSession();
    const { guard } = useAuthGuard();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [body, setBody] = useState("");
    const [tab, setTab] = useState<"write" | "preview">("write");
    const [previewHtml, setPreviewHtml] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const remaining = MAX - body.length;

    // ── Toolbar helper — identical to EditorToolbar.insertMarkdown ────────────
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

    // ── Toolbar definition — mirrors EditorToolbar tools ─────────────────────
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

    // ── Submit ────────────────────────────────────────────────────────────────
    function handleSubmit() {
        guard(async () => {
            if (!body.trim()) return;
            setError(null);

            startTransition(async () => {
                try {
                    const res = await fetch("/api/comments", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId, parentId, bodyMd: body.trim() }),
                    });

                    if (res.status === 429) {
                        toast.error("Muitos comentários seguidos. Aguarde um momento.");
                        return;
                    }
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error ?? "Erro ao publicar.");
                    }

                    setBody("");
                    setTab("write");
                    toast.success("Comentário publicado!");
                    onSuccess?.();
                } catch (e: any) {
                    setError(e.message ?? "Erro ao publicar comentário.");
                }
            });
        });
    }

    // ── Not logged in ────────────────────────────────────────────────────────
    if (!session) {
        return (
            <div
                className="rounded-lg border border-dashed border-border p-5 text-center cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => guard(() => { })}
            >
                <p className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium underline underline-offset-2">Faça login</span>
                    {" "}para comentar.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border overflow-hidden bg-background">
            {/* Tab bar */}
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

            {/* Toolbar — only in write mode, same style as blog EditorToolbar */}
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

            {/* Editor / Preview */}
            {tab === "write" ? (
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    autoFocus={autoFocus}
                    rows={parentId ? 4 : 6}
                    maxLength={MAX}
                    placeholder="Escreva seu comentário..."
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-mono resize-none focus:outline-none placeholder:text-muted-foreground placeholder:font-sans"
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); }
                        if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); insertMarkdown("**", "**"); }
                        if ((e.metaKey || e.ctrlKey) && e.key === "i") { e.preventDefault(); insertMarkdown("*", "*"); }
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

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-accent/10">
                <span className={`text-xs tabular-nums
                    ${remaining < 50 ? "text-red-500" : remaining < 150 ? "text-orange-500" : "text-muted-foreground"}`}>
                    {remaining.toLocaleString()} restantes
                </span>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            disabled={isPending}
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isPending || !body.trim()}
                        className="px-4 py-1.5 rounded-md bg-foreground text-background text-sm font-medium
                            hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isPending ? "Publicando…" : parentId ? "Responder" : "Comentar"}
                    </button>
                </div>
            </div>

            {error && <p className="px-3 pb-2 text-xs text-red-500">{error}</p>}
        </div>
    );
}
