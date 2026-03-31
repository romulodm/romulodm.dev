'use client';

import { useState } from "react";

export function FooterNewsletter() {
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
                setErrorMsg(data.error ?? "Algo deu errado.");
            }
        } catch {
            setState("error");
            setErrorMsg("Erro de conexão. Tente novamente.");
        }
    };

    return (
        <div className="border-b border-white/10 mb-5">
            <div className="pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Text */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            Fique por dentro
                        </h3>
                        <p className="text-white/50 text-sm sm:text-base">
                            Receba novidades sobre posts, projetos e ideias diretamente no seu e-mail.
                        </p>
                    </div>

                    {/* Form / States */}
                    {state === "success" ? (
                        <div className="flex flex-col items-center sm:items-start gap-2 p-4 bg-green-950/30 rounded-lg border border-green-800">
                            <p className="text-green-400 font-semibold">✅ Verifique seu e-mail!</p>
                            <p className="text-sm text-green-500">
                                Enviamos um link de confirmação para você.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    placeholder="Insira seu e-mail"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (state === "error") setState("idle");
                                    }}
                                    disabled={state === "loading"}
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded
                             text-white placeholder-white/30
                             focus:outline-none focus:ring-2 focus:ring-[#8DF868]/50
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={state === "loading" || !email}
                                    className="w-full sm:w-auto px-6 py-3 bg-[#8DF868] text-[#0e0e0e] rounded
                             font-semibold hover:bg-[#7ae055] transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {state === "loading" ? "Enviando..." : "Inscrever-se"}
                                </button>
                            </div>
                            {state === "error" && (
                                <p className="-mt-2 text-red-400 text-sm">{errorMsg}</p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
