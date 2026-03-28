"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/navigation/Navbar";

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
  const [items, setItems] = useState<SuspiciousComment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/suspicious-comments?page=${p}`);
    const data = await res.json();
    setItems(data.items);
    setPagination(data.pagination);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(page); }, [page, fetchItems]);

  async function approve(id: string) {
    await fetch(`/api/admin/suspicious-comments/${id}`, { method: "POST" });
    await fetchItems(page);
  }

  async function reject(id: string) {
    await fetch(`/api/admin/suspicious-comments/${id}`, { method: "DELETE" });
    fetchItems(page);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10 mt-12">
        <h1 className="text-2xl font-bold mb-2 text-black dark:text-white">
          Comentários Suspeitos
        </h1>
        {pagination && (
          <p className="text-sm text-gray-500 mb-6">
            {pagination.total} comentário(s) aguardando revisão
          </p>
        )}

        {loading && <p className="text-gray-400">Carregando...</p>}

        {!loading && items.length === 0 && (
          <p className="text-gray-500 mt-10 text-center">
            Nenhum comentário suspeito no momento 🎉
          </p>
        )}

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{item.author.username}</span>
                  {" · "}
                  <span className="text-xs">{item.author.email}</span>
                  {" · "}
                  <a
                    href={`/blog/${item.post.slug}`}
                    target="_blank"
                    className="underline text-blue-500 text-xs"
                  >
                    {item.post.title}
                  </a>
                </div>
                <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                  {item.reason ?? "flagged"}
                </span>
              </div>

              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap bg-white dark:bg-zinc-900 rounded p-3 border border-gray-200 dark:border-zinc-700">
                {item.bodyMd}
              </p>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => approve(item.id)}
                  className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  ✓ Aprovar
                </button>
                <button
                  onClick={() => reject(item.id)}
                  className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                >
                  ✕ Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {
          pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border rounded disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border rounded disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )
        }
      </main >
    </div >
  );
}