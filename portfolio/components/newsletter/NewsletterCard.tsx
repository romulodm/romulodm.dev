'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

interface NewsletterCardProps {
    /** Show a subscriber count for social proof */
    subscriberCount?: number;
}

export default function NewsletterCard({ subscriberCount = 0 }: NewsletterCardProps) {
    const [email, setEmail] = useState("");
    const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || state === "loading") return;

        setState("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await res.json();

            if (res.ok) {
                setState("success");
                setEmail("");
            } else {
                setState("error");
                setErrorMsg(data.error ?? "Algo deu errado. Tente novamente.");
            }
        } catch {
            setState("error");
            setErrorMsg("Erro de conexão. Tente novamente.");
        }
    };

    if (state === "success") {
        return (
            <section className="w-full h-full mx-auto px-6 py-12">
                <div className="max-w-xl mx-auto text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-secondary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Verifique seu e-mail! 📬
                    </h2>
                    <p className="text-muted-foreground">
                        Enviamos um link de confirmação. Clique nele para ativar sua inscrição.
                    </p>
                    <button
                        onClick={() => setState("idle")}
                        className="mt-6 text-sm text-secondary underline underline-offset-4 hover:opacity-70 transition-opacity"
                    >
                        Usar outro e-mail
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full mx-auto px-6 py-12">
            <div className="max-w-xl mx-auto">
                <div className="w-full flex flex-col sm:flex-row items-center justify-center mb-1 gap-1">
                    <h1 className="text-3xl mb-1.5 text-center font-extrabold text-secondary leading-tight">
                        The bests posts in your inbox
                    </h1>
                    <img
                        src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/512.gif"
                        alt="🥇"
                        width="27"
                        height="27"
                    />
                </div>

                <p className="text-lg text-center text-foreground mb-4">
                    Stay up to date with new posts and news.
                    <br />
                    {subscriberCount > 0 && (
                        <>
                            Loved by{" "}
                            <span className="font-bold text-foreground">
                                {subscriberCount.toLocaleString("pt-BR")}
                            </span>{" "}
                            inscritos.
                        </>
                    )}
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="flex items-stretch gap-3 bg-card border border-border rounded-lg p-2 shadow-sm"
                >
                    <div className="flex-1 min-w-0 pl-2">
                        <label className="text-xs font-semibold text-foreground">Email</label>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (state === "error") setState("idle");
                            }}
                            disabled={state === "loading"}
                            className="border-0 p-0 h-auto text-sm bg-transparent shadow-none focus-visible:ring-0 text-muted-foreground placeholder:text-muted-foreground disabled:opacity-50"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="rounded-lg self-center min-w-[110px]"
                        disabled={state === "loading" || !email}
                    >
                        {state === "loading" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Subscribe"
                        )}
                    </Button>
                </form>

                {state === "error" && (
                    <p className="mt-2 text-sm text-destructive text-center">{errorMsg}</p>
                )}

                <p className="text-sm mt-4 text-muted-foreground text-center">
                    <span className="font-bold text-foreground">No spam, ever. </span>
                    You can check the privacy policy here.
                </p>
            </div>
        </section>
    );
}
