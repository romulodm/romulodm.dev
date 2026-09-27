// components/wall/ui/DeleteBtn.tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  msgId: string;
  onDeleted: (id: string) => void;
}

export function DeleteBtn({ msgId, onDeleted }: Props) {
  const t = useTranslations("wall.actions");
  const [confirm, setConfirm]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wall/${msgId}`, { method: "DELETE" });
      if (res.ok) onDeleted(msgId);
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  if (loading) {
    return (
      <svg className="w-3.5 h-3.5 animate-spin text-neutral-400 dark:text-white/40" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"
                strokeDasharray="20 40" />
      </svg>
    );
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-neutral-500 dark:text-white/40 text-xs">{t("confirmDelete")}</span>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium transition-colors"
        >
          {t("yes")}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-neutral-400 hover:text-neutral-700 dark:text-white/30 dark:hover:text-white/60 text-xs transition-colors"
        >
          {t("no")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title={t("delete")}
      aria-label={t("delete")}
      className="text-neutral-400 hover:text-red-500 dark:text-white/25 dark:hover:text-red-400 transition-colors p-0.5"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
