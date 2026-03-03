"use client";

/**
 * MarkdownEditor — shared primitive used by CommentComposer and InlineEditor.
 *
 * Handles:
 *  - write / preview tabs
 *  - toolbar (bold, italic, link, lists, quote, code, code-block)
 *  - textarea with maxLength + remaining counter
 *  - keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+Enter → submit, Escape → cancel)
 *
 * Does NOT handle submission logic — consumers pass `onSubmit` callback.
 */

import { useRef, useState } from "react";
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

const MAX = 2000;

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

export interface MarkdownEditorProps {
    /** Controlled value */
    value: string;
    onChange: (value: string) => void;
    /** Called when the user submits (Ctrl+Enter or button click) */
    onSubmit: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
    rows?: number;
    /** Label for the submit button */
    submitLabel?: string;
    /** Shows a spinner + disables submit when true */
    isPending?: boolean;
    /** Shown above the tab bar (e.g. "Editando comentário") */
    headerLabel?: React.ReactNode;
    placeholder?: string;
}

const TOOLS: { icon: React.ElementType; label: string; before: string; after: string }[] = [
    { icon: Bold, label: "Negrito (Ctrl+B)", before: "**", after: "**" },
    { icon: Italic, label: "Itálico (Ctrl+I)", before: "*", after: "*" },
    { icon: LinkIcon, label: "Link", before: "[", after: "](url)" },
    { icon: List, label: "Lista", before: "\n- ", after: "" },
    { icon: ListOrdered, label: "Lista numerada", before: "\n1. ", after: "" },
    { icon: Quote, label: "Citação", before: "\n> ", after: "" },
    { icon: Code, label: "Código inline", before: "`", after: "`" },
    { icon: FileCode, label: "Bloco de código", before: "\n```\n", after: "\n```\n" },
];

export function MarkdownEditor({
    value,
    onChange,
    onSubmit,
    onCancel,
    autoFocus = false,
    rows = 6,
    submitLabel = "Comentar",
    isPending = false,
    headerLabel,
    placeholder = "Escreva seu comentário...",
}: MarkdownEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<"write" | "preview">("write");
    const [previewHtml, setPreviewHtml] = useState("");

    const remaining = MAX - value.length;

    function insert(before: string, after: string = "") {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.substring(start, end);
        const newValue = value.substring(0, start) + before + selected + after + value.substring(end);
        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            const cursor = start + before.length + selected.length;
            textarea.setSelectionRange(cursor, cursor);
        }, 0);
    }

    async function switchTab(t: "write" | "preview") {
        setTab(t);
        if (t === "preview") {
            const html = await renderToHtml(value);
            setPreviewHtml(html);
        }
    }

    return (
        <div className="rounded-lg border border-border overflow-hidden bg-background">
            {/* Optional header (e.g. "Editando comentário") */}
            {headerLabel && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-gray-300/30 dark:bg-neutral-800/50 text-xs text-muted-foreground font-medium">
                    {headerLabel}
                </div>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-border px-2 pt-1">
                {(["write", "preview"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => switchTab(t)}
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

            {/* Toolbar (write only) */}
            {tab === "write" && (
                <div className="flex gap-0.5 px-2 py-1.5 border-b border-border bg-gray-50 bg-gray-300/30 dark:bg-neutral-800/50">
                    {TOOLS.map((tool) => (
                        <button
                            key={tool.label}
                            type="button"
                            title={tool.label}
                            onClick={() => insert(tool.before, tool.after)}
                            className="p-1.5 rounded hover:bg-gray-300 dark:hover:bg-accent hover:dark:bg-neutral-800 transition-colors"
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
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus={autoFocus}
                    rows={rows}
                    maxLength={MAX}
                    placeholder={placeholder}
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-mono resize-none focus:outline-none placeholder:text-muted-foreground placeholder:font-sans"
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onSubmit(); }
                        if ((e.metaKey || e.ctrlKey) && e.key === "b") { e.preventDefault(); insert("**", "**"); }
                        if ((e.metaKey || e.ctrlKey) && e.key === "i") { e.preventDefault(); insert("*", "*"); }
                        if (e.key === "Escape" && onCancel) { e.preventDefault(); onCancel(); }
                    }}
                />
            ) : (
                <div
                    className={`min-h-24 px-3 py-2.5 prose prose-sm dark:prose-invert max-w-none
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
            <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-gray-300/30 dark:bg-neutral-800/50">
                <span className={`text-xs tabular-nums
                    ${remaining < 50 ? "text-red-500" : remaining < 150 ? "text-orange-500" : "text-muted-foreground"}`}>
                    {remaining.toLocaleString()} restantes
                </span>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isPending}
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isPending || !value.trim()}
                        className="px-4 py-1.5 rounded-md bg-primary text-background text-sm font-medium
                            hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                Salvando…
                            </span>
                        ) : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}