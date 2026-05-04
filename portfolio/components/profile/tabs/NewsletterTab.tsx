"use client";

import { useState, useTransition } from "react";
import { Check, Globe, Loader2, Mail } from "lucide-react";
import {
    updateNewsletterLocale,
    subscribeFromProfile,
} from "@/app/[locale]/profile/[username]/actions";
import type { NewsletterSub } from "../types";

const LOCALE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "pt", label: "Português" },
    { value: "es", label: "Español" },
];

interface Props {
    sub: NewsletterSub;
    email: string;
}

export function NewsletterTab({ sub, email }: Props) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
    const [selectedLocale, setSelectedLocale] = useState(sub?.preferredLocale ?? "en");

    const isActive = sub?.isConfirmed && !sub?.unsubscribedAt;
    const isAwaitingConfirm = sub && !sub.isConfirmed && !sub.unsubscribedAt;
    const isUnsubscribed = Boolean(sub?.unsubscribedAt);

    function handleSubscribe() {
        startTransition(async () => {
            try {
                await subscribeFromProfile();
                setStatus("ok");
            } catch {
                setStatus("error");
            }
        });
    }

    function handleLocaleChange(locale: string) {
        setSelectedLocale(locale);
        startTransition(async () => {
            try {
                await updateNewsletterLocale(locale);
                setStatus("ok");
                setTimeout(() => setStatus("idle"), 2000);
            } catch {
                setStatus("error");
            }
        });
    }

    function handleUnsubscribeRequest() {
        startTransition(async () => {
            try {
                await fetch("/api/newsletter/request-unsubscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });
                setStatus("ok");
            } catch {
                setStatus("error");
            }
        });
    }

    // ── Not subscribed / unsubscribed ─────────────────────────────────────────
    if (!sub || isUnsubscribed) {
        return (
            <div className="rounded-lg border border-border p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Assine a newsletter</p>
                        <p className="text-xs text-muted-foreground">
                            Receba novos artigos diretamente no e-mail
                        </p>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Enviaremos para <strong className="text-foreground">{email}</strong>
                </p>
                {status === "ok" ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Verifique seu e-mail para confirmar!
                    </p>
                ) : (
                    <button
                        onClick={handleSubscribe}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Inscrever-se
                    </button>
                )}
            </div>
        );
    }

    // ── Awaiting email confirmation ────────────────────────────────────────────
    if (isAwaitingConfirm) {
        return (
            <div className="rounded-lg border border-border p-6 space-y-3 text-center">
                <p className="text-2xl">📬</p>
                <p className="text-sm font-medium text-foreground">Confirmação pendente</p>
                <p className="text-xs text-muted-foreground">
                    Enviamos um link de confirmação para{" "}
                    <strong>{email}</strong>. Verifique sua caixa de entrada.
                </p>
                <button
                    onClick={handleSubscribe}
                    disabled={isPending}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                    Reenviar e-mail de confirmação
                </button>
            </div>
        );
    }

    // ── Active subscription ───────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-semibold text-foreground">Inscrito</span>
                    </div>
                    {status === "ok" && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Salvo
                        </span>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Idioma dos e-mails
                    </label>
                    <div className="flex gap-2">
                        {LOCALE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleLocaleChange(opt.value)}
                                disabled={isPending}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedLocale === opt.value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border text-muted-foreground hover:border-primary/50"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-border p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">Cancelar inscrição</p>
                <p className="text-xs text-muted-foreground">
                    Você receberá um e-mail de confirmação antes do cancelamento.
                </p>
                {status === "ok" ? (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Verifique seu e-mail para confirmar.
                    </p>
                ) : (
                    <button
                        onClick={handleUnsubscribeRequest}
                        disabled={isPending}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                        {isPending ? "Enviando…" : "Solicitar cancelamento"}
                    </button>
                )}
            </div>
        </div>
    );
}