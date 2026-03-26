'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2, Calendar, AlertCircle } from "lucide-react";

interface Campaign {
  id?: string;
  subject?: string;
  previewText?: string;
  content?: string;
}

interface CampaignFormProps {
  campaign?: Campaign;
  mode: "create" | "edit";
}

export default function CampaignForm({ campaign, mode }: CampaignFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [previewText, setPreviewText] = useState(campaign?.previewText ?? "");
  const [content, setContent] = useState(campaign?.content ?? "");
  const [scheduledAt, setScheduledAt] = useState("");

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [sendState, setSendState] = useState<"idle" | "confirm" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValid = subject.trim() && content.trim();

  // ── Save draft ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!isValid) return;
    setSaveState("saving");
    setErrorMsg("");

    try {
      const url =
        mode === "create"
          ? "/api/admin/newsletter/campaigns"
          : `/api/admin/newsletter/campaigns/${campaign!.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, previewText, content }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar.");
      }

      const saved = await res.json();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);

      if (mode === "create") {
        startTransition(() => {
          router.replace(`/admin/newsletter/campaigns/${saved.id}`);
        });
      }
    } catch (err: any) {
      setSaveState("error");
      setErrorMsg(err.message);
    }
  };

  // ── Send / schedule ────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (sendState === "confirm") {
      setSendState("sending");
      setErrorMsg("");

      try {
        const res = await fetch(
          `/api/admin/newsletter/campaigns/${campaign!.id}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {},
            ),
          },
        );

        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Erro ao enviar.");
        }

        setSendState("sent");
        startTransition(() => router.refresh());
      } catch (err: any) {
        setSendState("error");
        setErrorMsg(err.message);
      }
    } else {
      setSendState("confirm");
    }
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Subject */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Assunto do e-mail <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Novo artigo: Como escalar uma aplicação Node.js"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
                     placeholder:text-gray-400 transition-all"
          maxLength={150}
        />
        <p className="text-xs text-gray-400">{subject.length}/150 caracteres</p>
      </div>

      {/* Preview text */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Preview text{" "}
          <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Texto exibido antes de abrir o e-mail no cliente de e-mail"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
                     placeholder:text-gray-400 transition-all"
          maxLength={200}
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">
          Conteúdo (HTML) <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400">
          HTML inline-styled. O template base (header, footer, unsubscribe) é
          aplicado automaticamente.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`<h2>Título da campanha</h2>\n<p>Corpo do e-mail...</p>\n<a href="...">Leia mais →</a>`}
          rows={16}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
                     placeholder:text-gray-400 resize-y transition-all"
        />
      </div>

      {/* Schedule picker */}
      {mode === "edit" && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Agendar envio{" "}
            <span className="text-gray-400 font-normal">(deixe vazio para enviar imediatamente)</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
                       transition-all"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!isValid || saveState === "saving"}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                     px-6 py-3 bg-white border-2 border-gray-200 text-gray-700
                     rounded-xl font-semibold text-sm
                     hover:border-gray-300 hover:bg-gray-50 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveState === "saving" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveState === "saved" ? "Salvo! ✓" : "Salvar rascunho"}
        </button>

        {/* Send (only for existing campaigns) */}
        {mode === "edit" && (
          <>
            {sendState === "sent" ? (
              <div className="flex-1 text-center text-sm text-green-700 font-semibold bg-green-50 px-6 py-3 rounded-xl">
                ✅ Campanha{" "}
                {scheduledAt ? "agendada" : "enviada para a fila"}!
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={!isValid || sendState === "sending"}
                className={`flex-1 inline-flex items-center justify-center gap-2
                            px-6 py-3 rounded-xl font-semibold text-sm
                            transition-all disabled:opacity-50 disabled:cursor-not-allowed
                            ${
                              sendState === "confirm"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
              >
                {sendState === "sending" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sendState === "confirm"
                  ? "Confirmar envio agora"
                  : scheduledAt
                  ? "Agendar envio"
                  : "Enviar campanha"}
              </button>
            )}
          </>
        )}
      </div>

      {sendState === "confirm" && (
        <p className="text-xs text-amber-600 text-center -mt-2">
          ⚠️ Clique novamente para confirmar. Esta ação enviará e-mails para todos os inscritos ativos.
        </p>
      )}
    </div>
  );
}
