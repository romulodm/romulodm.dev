"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getIntlLocaleCode } from "@/lib/locales";

interface SuspiciousComment {
  id: string;
  bodyMd: string;
  reason: string | null;
  createdAt: string;
  author: { id: string; username: string; email: string };
  post: { id: string; title: string; slug: string };
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function SuspiciousCommentsPage() {
  const locale = useLocale();
  const t = useTranslations("admin.suspiciousCommentsPage");
  const localeCode = useMemo(() => getIntlLocaleCode(locale), [locale]);
  const formatNumber = useMemo(() => new Intl.NumberFormat(localeCode), [localeCode]);
  const [items, setItems] = useState<SuspiciousComment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async (nextPage: number) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/suspicious-comments?page=${nextPage}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(page);
  }, [fetchItems, page]);

  async function approve(id: string) {
    await fetch(`/api/admin/suspicious-comments/${id}`, { method: "POST" });
    await fetchItems(page);
  }

  async function reject(id: string) {
    await fetch(`/api/admin/suspicious-comments/${id}`, { method: "DELETE" });
    await fetchItems(page);
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        {pagination && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("pending", {
              count: formatNumber.format(pagination.total),
            })}
          </p>
        )}
      </div>

      {loading && <p className="text-muted-foreground">{t("loading")}</p>}

      {!loading && items.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-lg p-4 bg-secondary/20 dark:bg-secondary/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{item.author.username}</span>
                {" · "}
                <span className="text-xs">{item.author.email}</span>
                {" · "}
                <a
                  href={`/${locale}/blog/${item.post.slug}`}
                  target="_blank"
                  className="underline text-primary text-xs"
                >
                  {item.post.title}
                </a>
              </div>
              <span className="text-xs bg-primary/20 dark:bg-primary/40 text-black dark:text-white px-2 py-0.5 rounded-full">
                {item.reason ?? t("flagged")}
              </span>
            </div>

            <p className="text-sm text-foreground whitespace-pre-wrap bg-background rounded p-3 border border-border">
              {item.bodyMd}
            </p>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => approve(item.id)}
                className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                {t("approve")}
              </button>
              <button
                onClick={() => reject(item.id)}
                className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
              >
                {t("reject")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
            className="px-4 py-2 border border-border rounded disabled:opacity-40 text-foreground hover:bg-muted transition"
          >
            {t("previous")}
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {t("page", {
              page: formatNumber.format(page),
              totalPages: formatNumber.format(pagination.totalPages),
            })}
          </span>
          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="px-4 py-2 border border-border rounded disabled:opacity-40 text-foreground hover:bg-muted transition"
          >
            {t("next")}
          </button>
        </div>
      )}
    </main>
  );
}
