"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useAuthGuard } from "@/hooks/auth-guard";
import { toast } from "sonner";
import { MarkdownEditor } from "@/components/comments/MarkdownEditor";

interface CommentComposerProps {
    postId: string;
    parentId?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
    autoFocus?: boolean;
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
    const [body, setBody] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

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
                    toast.success("Comentário publicado!");
                    onSuccess?.();
                } catch (e: any) {
                    setError(e.message ?? "Erro ao publicar comentário.");
                }
            });
        });
    }

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
        <div>
            <MarkdownEditor
                value={body}
                onChange={setBody}
                onSubmit={handleSubmit}
                onCancel={onCancel}
                autoFocus={autoFocus}
                rows={parentId ? 4 : 6}
                submitLabel={parentId ? "Responder" : "Comentar"}
                isPending={isPending}
            />
            {error && <p className="mt-1 px-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}