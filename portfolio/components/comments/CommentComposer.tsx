"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAuthGuard } from "@/hooks/auth-guard";
import { toast } from "sonner";

interface CommentComposerProps {
    postId: string;
    parentId?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
}

// ── Toolbar button types ──────────────────────────────────────────────────────

type ToolbarAction =
    | { type: "wrap"; prefix: string; suffix: string; label: string; icon: React.ReactNode }
    | { type: "line-prefix"; prefix: string; label: string; icon: React.ReactNode }
    | { type: "link"; label: string; icon: React.ReactNode }
    | { type: "ordered-list"; label: string; icon: React.ReactNode };

// ── Icons (inline SVG, no dep) ────────────────────────────────────────────────

const BoldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.6 11.79A4 4 0 0 0 12 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h6.5a4.5 4.5 0 0 0 3.1-7.71ZM8 7h4a2 2 0 0 1 0 4H8Zm4.5 9H8v-4h4.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
);
const ItalicIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4v3h2.21l-3.42 10H6v3h8v-3h-2.21l3.42-10H18V4z" />
    </svg>
);
const LinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);
const CodeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
);
const UlIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);
const OlIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
        <path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
);
const QuoteIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
);

// ── Textarea manipulation helpers ─────────────────────────────────────────────

function insertAround(
    textarea: HTMLTextAreaElement,
    prefix: string,
    suffix: string,
    setValue: (v: string) => void
) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    setValue(newValue);
    // restore cursor
    requestAnimationFrame(() => {
        textarea.focus();
        const newStart = start + prefix.length;
        const newEnd = newStart + selected.length;
        textarea.setSelectionRange(newStart, newEnd);
    });
}

function insertLinePrefix(
    textarea: HTMLTextAreaElement,
    prefix: string,
    setValue: (v: string) => void
) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    // Find line boundaries
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const endPos = lineEnd === -1 ? value.length : lineEnd;
    const lines = value.slice(lineStart, endPos).split("\n");
    const newLines = lines.map((l) => {
        // toggle: if already has prefix, remove it
        if (l.startsWith(prefix)) return l.slice(prefix.length);
        return prefix + l;
    });
    const newValue = value.slice(0, lineStart) + newLines.join("\n") + value.slice(endPos);
    setValue(newValue);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    });
}

function insertOrderedList(
    textarea: HTMLTextAreaElement,
    setValue: (v: string) => void
) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const endPos = lineEnd === -1 ? value.length : lineEnd;
    const lines = value.slice(lineStart, endPos).split("\n");
    const newLines = lines.map((l, i) => {
        const prefix = `${i + 1}. `;
        if (l.match(/^\d+\. /)) return l.replace(/^\d+\. /, "");
        return prefix + l;
    });
    const newValue = value.slice(0, lineStart) + newLines.join("\n") + value.slice(endPos);
    setValue(newValue);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 3, end + 3);
    });
}

function insertLink(
    textarea: HTMLTextAreaElement,
    setValue: (v: string) => void
) {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end);
    const url = prompt("URL do link:", "https://");
    if (!url) return;
    const text = selected || "texto do link";
    const md = `[${text}](${url})`;
    const newValue = value.slice(0, start) + md + value.slice(end);
    setValue(newValue);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1 + text.length);
    });
}

// ── Markdown preview (very minimal — just for the preview tab) ────────────────

function renderMarkdownPreview(md: string): string {
    return md
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        // bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // inline code
        .replace(/`(.+?)`/g, '<code class="bg-accent px-1 rounded text-xs">$1</code>')
        // links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">$1</a>')
        // blockquote
        .replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-border pl-3 text-muted-foreground italic">$1</blockquote>')
        // unordered list
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        // ordered list
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        // wrap consecutive <li> in <ul>
        .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc list-inside space-y-0.5">${match}</ul>`)
        // line breaks
        .replace(/\n/g, "<br>");
}

// ── Main component ────────────────────────────────────────────────────────────

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
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const MAX = 2000;
    const remaining = MAX - body.length;

    // ── Toolbar actions ───────────────────────────────────────────────────────

    function applyTool(type: string, prefix?: string, suffix?: string) {
        const ta = textareaRef.current;
        if (!ta) return;

        if (type === "wrap" && prefix && suffix) {
            insertAround(ta, prefix, suffix, setBody);
        } else if (type === "line-prefix" && prefix) {
            insertLinePrefix(ta, prefix, setBody);
        } else if (type === "ordered-list") {
            insertOrderedList(ta, setBody);
        } else if (type === "link") {
            insertLink(ta, setBody);
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
                        const data = await res.json();
                        throw new Error(data.error ?? "Erro desconhecido");
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

    // ── If not logged in: show clickable placeholder ──────────────────────────

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

    // ── Toolbar definition ────────────────────────────────────────────────────

    const toolbarGroups = [
        [
            { type: "wrap", prefix: "**", suffix: "**", label: "Negrito", icon: <BoldIcon /> },
            { type: "wrap", prefix: "*", suffix: "*", label: "Itálico", icon: <ItalicIcon /> },
            { type: "wrap", prefix: "`", suffix: "`", label: "Código inline", icon: <CodeIcon /> },
        ],
        [
            { type: "link", label: "Link", icon: <LinkIcon /> },
        ],
        [
            { type: "line-prefix", prefix: "- ", label: "Lista", icon: <UlIcon /> },
            { type: "ordered-list", label: "Lista numerada", icon: <OlIcon /> },
            { type: "line-prefix", prefix: "> ", label: "Citação", icon: <QuoteIcon /> },
        ],
    ];

    return (
        <div className="rounded-lg border border-border overflow-hidden bg-background">
            {/* Tab bar */}
            <div className="flex items-center justify-between border-b border-border px-2 pt-1">
                <div className="flex">
                    {(["write", "preview"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors
                                ${tab === t
                                    ? "border-b-2 border-foreground text-foreground -mb-px"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {t === "write" ? "Escrever" : "Pré-visualizar"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toolbar (only in write mode) */}
            {tab === "write" && (
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-accent/20">
                    {toolbarGroups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-0.5">
                            {gi > 0 && <span className="w-px h-4 bg-border mx-1" />}
                            {group.map((tool) => (
                                <button
                                    key={tool.label}
                                    type="button"
                                    title={tool.label}
                                    onClick={() => applyTool(tool.type, (tool as any).prefix, (tool as any).suffix)}
                                    className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    {tool.icon}
                                </button>
                            ))}
                        </div>
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
                    placeholder="Escreva seu comentário... (suporta **negrito**, *itálico*, [links](url), listas)"
                    className="w-full bg-transparent px-3 py-2.5 text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit();
                        }
                        if ((e.metaKey || e.ctrlKey) && e.key === "b") {
                            e.preventDefault();
                            applyTool("wrap", "**", "**");
                        }
                        if ((e.metaKey || e.ctrlKey) && e.key === "i") {
                            e.preventDefault();
                            applyTool("wrap", "*", "*");
                        }
                    }}
                />
            ) : (
                <div
                    className="min-h-[6rem] px-3 py-2.5 text-sm text-foreground/90 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                        __html: body.trim()
                            ? renderMarkdownPreview(body)
                            : '<span class="text-muted-foreground italic">Nada para pré-visualizar.</span>',
                    }}
                />
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-accent/10">
                <span className={`text-xs tabular-nums ${remaining < 150 ? remaining < 50 ? "text-red-500" : "text-orange-500" : "text-muted-foreground"}`}>
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

            {error && (
                <p className="px-3 pb-2 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
