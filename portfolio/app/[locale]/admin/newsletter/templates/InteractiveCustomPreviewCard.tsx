'use client';

// app/[locale]/admin/newsletter/templates/InteractiveCustomPreviewCard.tsx

import { useState } from "react";
import { Code2, Eye } from "lucide-react";

interface Props {
    id: string;
    label: string;
    description: string;
    html: string; // HTML inicial de exemplo
}

export function InteractiveCustomPreviewCard({ id, label, description, html }: Props) {
    const [mode, setMode] = useState<"preview" | "editor">("preview");
    const [customHtml, setCustomHtml] = useState(html);

    return (
        <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{label}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    {id}
                </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                {/* Browser chrome com toggle editor/preview */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-400/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                        <span className="w-3 h-3 rounded-full bg-green-400/80" />
                        <span className="ml-3 text-xs text-muted-foreground font-mono">{label}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setMode("preview")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === "preview"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Eye className="w-3 h-3" />
                            Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("editor")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${mode === "editor"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Code2 className="w-3 h-3" />
                            HTML
                        </button>
                    </div>
                </div>

                {mode === "preview" ? (
                    /* Live preview — atualiza enquanto o usuário digita no editor */
                    <iframe
                        srcDoc={customHtml}
                        title="Custom email live preview"
                        className="w-full border-0"
                        style={{ height: "600px" }}
                        sandbox="allow-same-origin"
                        loading="lazy"
                    />
                ) : (
                    /* Editor HTML */
                    <div className="relative">
                        <textarea
                            value={customHtml}
                            onChange={(e) => setCustomHtml(e.target.value)}
                            rows={24}
                            spellCheck={false}
                            className="w-full px-5 py-4 text-sm font-mono bg-neutral-950 text-green-300 border-0 resize-none focus:outline-none focus:ring-0 leading-relaxed"
                            placeholder="Cole ou escreva seu HTML aqui..."
                        />
                        <div className="absolute bottom-3 right-4 text-xs text-neutral-600 font-mono">
                            {customHtml.length.toLocaleString()} chars
                        </div>
                    </div>
                )}
            </div>

            {mode === "editor" && (
                <p className="text-xs text-muted-foreground">
                    Alterne para <strong>Preview</strong> para ver como o e-mail ficará no cliente de e-mail.
                </p>
            )}
        </section>
    );
}