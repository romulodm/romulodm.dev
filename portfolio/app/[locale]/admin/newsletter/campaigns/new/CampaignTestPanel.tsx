'use client';

import { useEffect, useState } from "react";
import { FlaskConical, Loader2, Plus, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface Tester {
  id: string;
  email: string;
  preferredLocale: string;
}

interface SentRecipient {
  email: string;
  locale: string;
  subject: string;
}

interface CampaignTestPanelProps {
  campaignId: string;
  disabled: boolean;
  /**
   * Persists the form before the test goes out, so the test always reflects
   * what is on screen. Resolves to false when the save failed; the form shows
   * its own error in that case.
   */
  onBeforeSend: () => Promise<boolean>;
}

const API = "/api/admin/newsletter/test-recipients";

async function errorFrom(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export default function CampaignTestPanel({
  campaignId,
  disabled,
  onBeforeSend,
}: CampaignTestPanelProps) {
  const t = useTranslations("admin.campaignForm.test");

  // null until the first load succeeds: a failed load shows no empty state,
  // since "no test emails yet" would be false information.
  const [testers, setTesters] = useState<Tester[] | null>(null);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [sent, setSent] = useState<SentRecipient[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(API)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { testers: Tester[] } | null) => {
        if (!cancelled && data) setTesters(data.testers);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async () => {
    const value = email.trim();
    if (!value) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, t("errors.add")));
      const { tester } = (await res.json()) as { tester: Tester };
      setTesters((prev) => {
        const list = (prev ?? []).filter((item) => item.id !== tester.id);
        return [...list, tester].sort((a, b) => a.email.localeCompare(b.email));
      });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.add"));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    const previous = testers;
    setTesters((prev) => (prev ?? []).filter((item) => item.id !== id));
    const res = await fetch(`${API}/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setTesters(previous);
  };

  const handleSend = async () => {
    setError("");
    setSendState("sending");
    const saved = await onBeforeSend();
    if (!saved) {
      setSendState("idle");
      return;
    }
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${campaignId}/test`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await errorFrom(res, t("errors.send")));
      const data = (await res.json()) as { recipients: SentRecipient[] };
      setSent(data.recipients);
      setSendState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.send"));
      setSendState("idle");
    }
  };

  const count = testers?.length ?? 0;

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-gray-400" />
          {t("title")}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("description")}</p>
      </div>

      {testers !== null && testers.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">{t("empty")}</p>
      )}

      {count > 0 && (
        <ul className="flex flex-wrap gap-2">
          {testers!.map((tester) => (
            <li
              key={tester.id}
              className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-gray-700 dark:text-gray-300"
            >
              <span>{tester.email}</span>
              <span className="font-mono text-[10px] uppercase text-gray-400">{tester.preferredLocale}</span>
              <button
                type="button"
                onClick={() => handleRemove(tester.id)}
                aria-label={t("remove", { email: tester.email })}
                className="p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
        />
        <button
          type="submit"
          disabled={adding || !email.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {t("add")}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || count === 0 || sendState === "sending"}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {sendState === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {t("send", { count })}
      </button>

      {sendState === "sent" && (
        <div className="space-y-1 text-xs text-green-700 dark:text-green-400">
          <p className="font-semibold">{t("sent", { count: sent.length })}</p>
          <ul className="space-y-0.5 text-gray-600 dark:text-gray-400">
            {sent.map((item) => (
              <li key={item.email} className="truncate">
                <span className="font-mono uppercase text-[10px] mr-1.5">{item.locale}</span>
                {item.email} · {item.subject}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
