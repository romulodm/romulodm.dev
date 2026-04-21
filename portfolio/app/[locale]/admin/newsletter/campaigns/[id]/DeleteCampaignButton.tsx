'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin.campaignDelete");
  const [, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        startTransition(() => {
          router.push(`/${locale}/admin/newsletter/campaigns`);
        });
        return;
      }
    } catch {
      // Keep the inline confirmation UI open so the user can try again.
    }

    setDeleting(false);
  };

  if (confirmOpen) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("confirm")}
        </span>
        <button
          onClick={() => setConfirmOpen(false)}
          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {deleting ? t("deleting") : t("delete")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmOpen(true)}
      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      title={t("title")}
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
