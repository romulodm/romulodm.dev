'use client';

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface Post {
  id: string;
  title: string;
  summary: string | null;
  slug: string;
  publishedAt: string | null;
}

interface Campaign {
  id?: string;
  type?: "POST_BASED" | "CUSTOM";
  subject?: string;
  previewText?: string;
  content?: string;
  postId?: string | null;
}

interface CampaignFormProps {
  campaign?: Campaign;
  mode: "create" | "edit";
  publishedPosts?: Post[];
}

function buildPostPreviewHtml(
  post: Post,
  locale: string,
  callToAction: string,
  appUrl = "",
) {
  const baseUrl = appUrl.replace(/\/$/, "");
  const url = `${baseUrl}/${locale}/blog/${post.slug}`;

  return `
<h2 style="margin:0 0 12px;font-size:22px;color:#111;">${post.title}</h2>
${post.summary ? `<p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">${post.summary}</p>` : ""}
<a href="${url}" style="display:inline-block;padding:10px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
  ${callToAction}
</a>
`.trim();
}

export default function CampaignForm({ campaign, mode, publishedPosts = [] }: CampaignFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.campaignForm");
  const [, startTransition] = useTransition();
  const [campaignType, setCampaignType] = useState<"POST_BASED" | "CUSTOM">(
    campaign?.type ?? "CUSTOM",
  );
  const [selectedPostId, setSelectedPostId] = useState(campaign?.postId ?? "");
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [previewText, setPreviewText] = useState(campaign?.previewText ?? "");
  const [content, setContent] = useState(campaign?.content ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [sendState, setSendState] = useState<"idle" | "confirm" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedPost = publishedPosts.find((post) => post.id === selectedPostId) ?? null;

  useEffect(() => {
    if (campaignType === "POST_BASED" && selectedPost && mode === "create") {
      setSubject(t("autoSubject", { title: selectedPost.title }));
      setPreviewText(selectedPost.summary ?? "");
    }
  }, [campaignType, mode, selectedPost, t]);

  const isValid = campaignType === "POST_BASED"
    ? Boolean(selectedPostId && subject.trim())
    : Boolean(subject.trim() && content.trim());

  function buildPayload() {
    if (campaignType === "POST_BASED") {
      return {
        type: "POST_BASED",
        postId: selectedPostId,
        subject,
        previewText,
      };
    }

    return {
      type: "CUSTOM",
      subject,
      previewText,
      content,
    };
  }

  const handleSave = async () => {
    if (!isValid) return;

    setSaveState("saving");
    setErrorMsg("");

    try {
      const url = mode === "create"
        ? "/api/admin/newsletter/campaigns"
        : `/api/admin/newsletter/campaigns/${campaign?.id}`;

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("errors.save"));
      }

      const saved = await res.json();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);

      if (mode === "create") {
        startTransition(() => {
          router.replace(`/${locale}/admin/newsletter/campaigns/${saved.id}`);
        });
      }
    } catch (error) {
      setSaveState("error");
      setErrorMsg(error instanceof Error ? error.message : t("errors.save"));
    }
  };

  const handleSend = async () => {
    if (sendState !== "confirm") {
      setSendState("confirm");
      return;
    }

    setSendState("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${campaign?.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {},
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("errors.send"));
      }

      setSendState("sent");
      startTransition(() => router.refresh());
    } catch (error) {
      setSendState("error");
      setErrorMsg(error instanceof Error ? error.message : t("errors.send"));
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {mode === "create" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("type.label")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCampaignType("POST_BASED")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${campaignType === "POST_BASED"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800/50"
                }`}
            >
              <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${campaignType === "POST_BASED" ? "text-green-600" : "text-gray-400"}`} />
              <div>
                <p className={`text-sm font-semibold ${campaignType === "POST_BASED" ? "text-green-800 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {t("type.post.title")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("type.post.description")}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCampaignType("CUSTOM")}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${campaignType === "CUSTOM"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800/50"
                }`}
            >
              <Code2 className={`w-5 h-5 mt-0.5 shrink-0 ${campaignType === "CUSTOM" ? "text-green-600" : "text-gray-400"}`} />
              <div>
                <p className={`text-sm font-semibold ${campaignType === "CUSTOM" ? "text-green-800 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                  {t("type.custom.title")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("type.custom.description")}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {campaignType === "POST_BASED" && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("post.label")} <span className="text-red-500">*</span>
          </label>
          {publishedPosts.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              {t("post.empty")}
            </p>
          ) : (
            <div className="relative">
              <select
                value={selectedPostId}
                onChange={(event) => setSelectedPostId(event.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
              >
                <option value="">{t("post.placeholder")}</option>
                {publishedPosts.map((post) => (
                  <option key={post.id} value={post.id}>{post.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {selectedPost && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-neutral-800/60 border border-gray-200 dark:border-neutral-700 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedPost.title}</p>
                <a
                  href={`/${locale}/blog/${selectedPost.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              {selectedPost.summary && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{selectedPost.summary}</p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("template.previewLabel")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowHtmlPreview((current) => !current)}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                  >
                    <Eye className="w-3 h-3" />
                    {showHtmlPreview ? t("template.hideHtml") : t("template.showHtml")}
                  </button>
                </div>
                {showHtmlPreview ? (
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
                    {buildPostPreviewHtml(selectedPost, locale, t("template.readArticle"))}
                  </pre>
                ) : (
                  <div
                    className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-neutral-700 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: buildPostPreviewHtml(selectedPost, locale, t("template.readArticle")),
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("subject.label")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={campaignType === "POST_BASED" ? t("subject.placeholderPost") : t("subject.placeholderCustom")}
          className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
          maxLength={150}
        />
        <p className="text-xs text-gray-400">{t("subject.counter", { count: subject.length })}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("previewText.label")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(event) => setPreviewText(event.target.value)}
          placeholder={t("previewText.placeholder")}
          className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
          maxLength={200}
        />
      </div>

      {campaignType === "CUSTOM" && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("content.label")} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("content.help")}
          </p>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("content.placeholder")}
            rows={16}
            className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-mono bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-y transition-all"
          />
        </div>
      )}

      {mode === "edit" && (
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            {t("schedule.label")}{" "}
            <span className="text-gray-400 font-normal">({t("schedule.hint")})</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            className="px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!isValid || saveState === "saving"}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveState === "saving" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveState === "saved" ? t("save.saved") : t("save.action")}
        </button>

        {mode === "edit" && (
          <>
            {sendState === "sent" ? (
              <div className="flex-1 text-center text-sm text-green-700 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-xl">
                {scheduledAt ? t("sendSuccess.scheduled") : t("sendSuccess.queued")}
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={!isValid || sendState === "sending"}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sendState === "confirm"
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
                  ? t("send.confirm")
                  : scheduledAt
                    ? t("send.schedule")
                    : t("send.action")}
              </button>
            )}
          </>
        )}
      </div>

      {sendState === "confirm" && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center -mt-2">
          {t("send.confirmHelp")}
        </p>
      )}
    </div>
  );
}
