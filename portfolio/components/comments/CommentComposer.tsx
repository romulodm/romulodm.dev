"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { createComment } from "@/lib/comments";

interface CommentComposerProps {
    postId: string;
    parentId?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function CommentComposer({
    postId,
    parentId = null,
    onSuccess,
    onCancel,
    placeholder = "Escreva seu comentário...",
    autoFocus = false,
}: CommentComposerProps) {
    const { data: session } = useSession();
    const [body, setBody] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    if (!session) {
        return (
            <div className="rounded-lg border border-dashed border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">
                    <Link href="/auth/signin" className="text-foreground underline underline-offset-2 hover:no-underline">
                        Faça login
                    </Link>{" "}
                    para comentar.
                </p>
            </div>
        );
    }

    function handleSubmit() {
        if (!body.trim()) return;
        setError(null);

        startTransition(async () => {
            try {
                await createComment({ postId, parentId, body: body.trim() });
                setBody("");
                onSuccess?.();
            } catch (e) {
                setError("Erro ao publicar comentário. Tente novamente.");
            }
        });
    }

    const remaining = 2000 - body.length;

    return (
        <div className="space-y-2">
            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={placeholder}
                autoFocus={autoFocus}
                rows={parentId ? 3 : 4}
                maxLength={2000}
                className="w-full rounded-lg border border-border bg-background p-3 text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground
                    transition-colors"
            />
            <div className="flex items-center justify-between">
                <span className={`text-xs tabular-nums ${remaining < 100 ? "text-orange-500" : "text-muted-foreground"}`}>
                    {remaining} caracteres restantes
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
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
