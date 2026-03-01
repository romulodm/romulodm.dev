"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteCommentModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    /** Preview of the comment being deleted */
    bodyPreview?: string;
}

export function DeleteCommentModal({
    open,
    onClose,
    onConfirm,
    bodyPreview,
}: DeleteCommentModalProps) {
    const [isPending, startTransition] = useTransition();
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Focus trap: focus "Cancelar" when modal opens
    useEffect(() => {
        if (open) {
            // Small delay so the modal is visible before focusing
            const t = setTimeout(() => cancelRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isPending) onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, isPending, onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;

    function handleConfirm() {
        startTransition(async () => {
            try {
                await onConfirm();
                onClose();
            } catch {
                toast.error("Erro ao apagar comentário.");
            }
        });
    }

    const preview = bodyPreview?.slice(0, 120);
    const truncated = bodyPreview && bodyPreview.length > 120;

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose(); }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="delete-modal-title"
        >
            {/* Panel */}
            <div
                className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl
                    flex flex-col overflow-hidden
                    animate-in fade-in zoom-in-95 duration-150"
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10 shrink-0">
                        <Trash2 className="w-4.5 h-4.5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2
                            id="delete-modal-title"
                            className="text-sm font-semibold text-foreground leading-snug"
                        >
                            Apagar comentário
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Esta ação não pode ser desfeita.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        aria-label="Fechar"
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent
                            transition-colors disabled:opacity-40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    <div className="flex items-start gap-2.5 rounded-lg bg-red-500/5 border border-red-500/20 p-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            Ao apagar, o comentário e todas as suas respostas serão{" "}
                            <span className="font-semibold text-foreground">removidos permanentemente</span>.
                        </p>
                    </div>

                    {preview && (
                        <div className="rounded-lg border border-border bg-accent/30 px-3 py-2.5">
                            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                                Seu comentário
                            </p>
                            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 font-mono">
                                {preview}
                                {truncated && (
                                    <span className="text-muted-foreground not-italic"> …</span>
                                )}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-1">
                    <button
                        ref={cancelRef}
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 text-sm rounded-lg border border-border text-foreground
                            hover:bg-accent transition-colors disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
                            bg-red-500 text-white hover:bg-red-600 transition-colors
                            disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Apagando…
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-3.5 h-3.5" />
                                Apagar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
