'use client';

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Languages,
  Layers,
  Loader2,
  Save,
  Send,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  CAMPAIGN_TARGET_LOCALES,
  isTranslatableCampaignType,
  parseCampaignTranslations,
  type LocalizedCopy,
} from "@/lib/newsletter/campaign-copy";
import CampaignTestPanel from "./CampaignTestPanel";

interface Post {
  id: string;
  title: string;
  summary: string | null;
  slug: string;
  publishedAt: string | null;
}

interface Campaign {
  id?: string;
  type?: "POST_BASED" | "CUSTOM" | "DIGEST";
  subject?: string;
  previewText?: string;
  content?: string;
  postId?: string | null;
  postIds?: string[];
  /** Raw `Campaign.translations` value. */
  translations?: unknown;
}

interface CampaignFormProps {
  campaign?: Campaign;
  mode: "create" | "edit";
  publishedPosts?: Post[];
  previewHtmlMap?: Record<string, string>;
}

export default function CampaignForm({
  campaign,
  mode,
  publishedPosts = [],
  previewHtmlMap = {},
}: CampaignFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.campaignForm");
  const [, startTransition] = useTransition();

  const [campaignType, setCampaignType] = useState<"POST_BASED" | "CUSTOM" | "DIGEST">(
    campaign?.type ?? "CUSTOM",
  );

  // POST_BASED
  const [selectedPostId, setSelectedPostId] = useState(campaign?.postId ?? "");

  // DIGEST — ordered list of selected post IDs
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>(campaign?.postIds ?? []);

  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const [previewText, setPreviewText] = useState(campaign?.previewText ?? "");
  const [content, setContent] = useState(campaign?.content ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showCustomPreview, setShowCustomPreview] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [sendState, setSendState] = useState<"idle" | "confirm" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Translations of subject/previewText. `translationSource` is the PT copy
  // they were made from; when it differs from the fields above, the server
  // translates again on the next save.
  const initialTranslations = parseCampaignTranslations(campaign?.translations);
  const [translations, setTranslations] = useState<Record<string, LocalizedCopy>>(
    initialTranslations?.locales ?? {},
  );
  const [translationSource, setTranslationSource] = useState<LocalizedCopy | null>(
    initialTranslations?.source ?? null,
  );
  const [translationFailed, setTranslationFailed] = useState(false);
  const translatable = isTranslatableCampaignType(campaignType);
  const hasTranslations = CAMPAIGN_TARGET_LOCALES.some((code) => translations[code]);
  const translationsStale =
    translationSource !== null &&
    (translationSource.subject !== subject.trim() ||
      (translationSource.previewText ?? "") !== previewText.trim());

  function updateTranslation(code: string, field: keyof LocalizedCopy, value: string) {
    setTranslations((prev) => {
      const current = prev[code] ?? { subject: "", previewText: null };
      return { ...prev, [code]: { ...current, [field]: value } };
    });
  }

  const selectedPost = publishedPosts.find((p) => p.id === selectedPostId) ?? null;
  const previewHtml = selectedPostId ? previewHtmlMap[selectedPostId] : undefined;

  // Auto-fill subject/previewText for POST_BASED
  useEffect(() => {
    if (campaignType === "POST_BASED" && selectedPost && mode === "create") {
      setSubject(t("autoSubject", { title: selectedPost.title }));
      setPreviewText(selectedPost.summary ?? "");
    }
  }, [campaignType, mode, selectedPost, t]);

  // ── Digest helpers ──────────────────────────────────────────────────────────

  function toggleDigestPost(postId: string) {
    setSelectedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  }

  function moveDigestPost(index: number, direction: "up" | "down") {
    setSelectedPostIds((prev) => {
      const next = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  const isValid =
    campaignType === "POST_BASED"
      ? Boolean(selectedPostId && subject.trim())
      : campaignType === "DIGEST"
        ? Boolean(selectedPostIds.length >= 2 && subject.trim())
        : Boolean(subject.trim() && content.trim());

  // ── Payload ─────────────────────────────────────────────────────────────────

  function buildPayload() {
    if (campaignType === "POST_BASED") {
      return { type: "POST_BASED", postId: selectedPostId, subject, previewText, translations };
    }
    if (campaignType === "DIGEST") {
      return { type: "DIGEST", postIds: selectedPostIds, subject, previewText, translations };
    }
    return { type: "CUSTOM", subject, previewText, content };
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  // Resolves to true when the campaign was saved; the test panel relies on it.
  const handleSave = async (): Promise<boolean> => {
    if (!isValid) return false;
    setSaveState("saving");
    setErrorMsg("");
    try {
      const url =
        mode === "create"
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
      const savedTranslations = parseCampaignTranslations(saved.translations);
      setTranslations(savedTranslations?.locales ?? {});
      setTranslationSource(savedTranslations?.source ?? null);
      setTranslationFailed(Boolean(saved.translationFailed));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
      if (mode === "create") {
        startTransition(() => {
          router.replace(`/${locale}/admin/newsletter/campaigns/${saved.id}`);
        });
      }
      return true;
    } catch (error) {
      setSaveState("error");
      setErrorMsg(error instanceof Error ? error.message : t("errors.save"));
      return false;
    }
  };

  const handleSend = async () => {
    if (sendState !== "confirm") { setSendState("confirm"); return; }
    setSendState("sending");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${campaign?.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
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

  // ── Render ──────────────────────────────────────────────────────────────────

  const TYPES = ["POST_BASED", "DIGEST", "CUSTOM"] as const;

  const typeConfig = {
    POST_BASED: { icon: FileText, title: t("type.post.title"), desc: t("type.post.description") },
    DIGEST: { icon: Layers, title: t("type.digest.title"), desc: t("type.digest.description") },
    CUSTOM: { icon: Code2, title: t("type.custom.title"), desc: t("type.custom.description") },
  };

  // Posts not yet added to digest (available to pick)
  const availablePosts = publishedPosts.filter((p) => !selectedPostIds.includes(p.id));

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Campaign type selector ─────────────────────────────────────────── */}
      {mode === "create" && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("type.label")}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TYPES.map((type) => {
              const cfg = typeConfig[type];
              const active = campaignType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCampaignType(type)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${active
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-neutral-700 hover:border-gray-300 bg-white dark:bg-neutral-800/50"
                    }`}
                >
                  <cfg.icon
                    className={`w-5 h-5 mt-0.5 shrink-0 ${active ? "text-green-600" : "text-gray-400"}`}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${active ? "text-green-800 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {cfg.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cfg.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── POST_BASED: single post selector ──────────────────────────────── */}
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
                onChange={(e) => { setSelectedPostId(e.target.value); setShowEmailPreview(false); }}
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

          {/* Email preview for POST_BASED */}
          {selectedPost && previewHtml && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t("template.previewLabel")}
                </p>
                <div className="flex items-center gap-2">
                  <a href={`/${locale}/blog/${selectedPost.slug}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button type="button" onClick={() => setShowEmailPreview((v) => !v)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                    {showEmailPreview ? <><EyeOff className="w-3 h-3" /> {t("template.hideHtml")}</> : <><Eye className="w-3 h-3" /> {t("template.showPreview")}</>}
                  </button>
                </div>
              </div>
              {showEmailPreview && (
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    <span className="ml-2 text-xs text-gray-400 font-mono truncate">{selectedPost.title}</span>
                  </div>
                  <iframe srcDoc={previewHtml} title={t("builder.iframeTitle")} className="w-full border-0 bg-[#f0ede8]" style={{ height: "520px" }} sandbox="allow-same-origin" loading="lazy" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DIGEST: multi-post selector with order ─────────────────────────── */}
      {campaignType === "DIGEST" && (
        <div className="space-y-4">
          {/* Selected posts (ordered) */}
          {selectedPostIds.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t("builder.selected", { count: selectedPostIds.length })}
              </p>
              <div className="space-y-2">
                {selectedPostIds.map((id, index) => {
                  const post = publishedPosts.find((p) => p.id === id);
                  if (!post) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                    >
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 w-5 text-center shrink-0">
                        {index + 1}
                      </span>
                      <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveDigestPost(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDigestPost(index, "down")}
                          disabled={index === selectedPostIds.length - 1}
                          className="p-1 rounded hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDigestPost(id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available posts to add */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {selectedPostIds.length === 0 ? t("builder.selectPosts") : t("builder.addMore")}
              {selectedPostIds.length < 2 && (
                <span className="ml-2 text-xs font-normal text-amber-500">{t("builder.minimum", { count: 2 })}</span>
              )}
            </label>
            {availablePosts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {t("builder.allAdded")}
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availablePosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => toggleDigestPost(post.id)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 text-left transition-all"
                  >
                    <FileText className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{post.title}</p>
                      {post.summary && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{post.summary}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Digest preview (simplified) */}
          {selectedPostIds.length >= 2 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t("builder.orderPreview")}
              </p>
              <div className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">{t("builder.digestLabel", { count: selectedPostIds.length })}</span>
                </div>
                <div className="p-4 space-y-4 bg-[#f0ede8]">
                  {selectedPostIds.map((id, i) => {
                    const post = publishedPosts.find((p) => p.id === id);
                    if (!post) return null;
                    return (
                      <div key={id} className={`pb-4 ${i < selectedPostIds.length - 1 ? "border-b border-gray-300" : ""}`}>
                        <p className="text-[10px] font-bold text-[#f57842] uppercase tracking-wider mb-1">
                          #{i + 1}
                        </p>
                        <p className="text-sm font-bold text-gray-900 leading-snug">{post.title}</p>
                        {post.summary && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{post.summary}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CUSTOM: HTML textarea + live preview ──────────────────────────── */}
      {campaignType === "CUSTOM" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("content.label")} <span className="text-red-500">*</span>
            </label>
            {content.trim() && (
              <button
                type="button"
                onClick={() => setShowCustomPreview((v) => !v)}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                {showCustomPreview
                  ? <><EyeOff className="w-3 h-3" /> {t("builder.hidePreview")}</>
                  : <><Eye className="w-3 h-3" /> {t("builder.showPreview")}</>}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{t("content.help")}</p>

          {showCustomPreview && content.trim() ? (
            /* Live preview mode — iframe fills the space */
            <div className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">{t("builder.customLabel")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomPreview(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3" /> {t("builder.editHtml")}
                </button>
              </div>
              <iframe
                srcDoc={content}
                title={t("builder.customIframeTitle")}
                className="w-full border-0"
                style={{ height: "600px" }}
                sandbox="allow-same-origin"
                loading="lazy"
              />
            </div>
          ) : (
            /* Edit mode — textarea */
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("content.placeholder")}
              rows={16}
              className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-mono bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-y transition-all"
            />
          )}
        </div>
      )}

      {/* ── Subject ────────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("subject.label")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={
            campaignType === "POST_BASED"
              ? t("subject.placeholderPost")
              : campaignType === "DIGEST"
                ? "Ex: Novidades de maio — 3 artigos para você"
                : t("subject.placeholderCustom")
          }
          className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
          maxLength={150}
        />
        <p className="text-xs text-gray-400">{t("subject.counter", { count: subject.length })}</p>
      </div>

      {/* ── Preview text ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t("previewText.label")}{" "}
          <span className="text-gray-400 font-normal">({t("common.optional")})</span>
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder={t("previewText.placeholder")}
          className="w-full px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
          maxLength={200}
        />
      </div>

      {/* ── Translations (POST_BASED and DIGEST only) ──────────────────────── */}
      {translatable && (
        <div className="space-y-3 rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Languages className="w-4 h-4 text-gray-400" />
            {t("translations.title")}
          </p>

          {translationFailed ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t("translations.failed")}</p>
          ) : !hasTranslations ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("translations.hint")}</p>
          ) : translationsStale ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t("translations.stale")}</p>
          ) : null}

          {CAMPAIGN_TARGET_LOCALES.map((code) => {
            const copy = translations[code];
            if (!copy) return null;
            return (
              <div key={code} className="space-y-2">
                <span className="inline-block font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {code}
                </span>
                <input
                  type="text"
                  value={copy.subject}
                  onChange={(e) => updateTranslation(code, "subject", e.target.value)}
                  aria-label={`${t("translations.subject")} (${code.toUpperCase()})`}
                  placeholder={t("translations.subject")}
                  maxLength={150}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
                />
                {(previewText.trim() || copy.previewText) && (
                  <input
                    type="text"
                    value={copy.previewText ?? ""}
                    onChange={(e) => updateTranslation(code, "previewText", e.target.value)}
                    aria-label={`${t("translations.previewText")} (${code.toUpperCase()})`}
                    placeholder={t("translations.previewText")}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Schedule (edit mode only) ──────────────────────────────────────── */}
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
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            className="px-4 py-3 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all"
          />
        </div>
      )}

      {/* ── Send test (edit mode only) ──────────────────────────────────────── */}
      {mode === "edit" && campaign?.id && (
        <CampaignTestPanel
          campaignId={campaign.id}
          disabled={!isValid || saveState === "saving"}
          onBeforeSend={handleSave}
        />
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!isValid || saveState === "saving"}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveState === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saveState === "saved" ? t("save.saved") : t("save.action")}
        </button>

        {mode === "edit" && (
          sendState === "sent" ? (
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
              {sendState === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sendState === "confirm"
                ? t("send.confirm")
                : scheduledAt
                  ? t("send.schedule")
                  : t("send.action")}
            </button>
          )
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