// src/app/admin/newsletter/campaigns/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import Navbar from "@/components/navigation/Navbar";
import { prisma } from "@romulo/database";
import { Plus, ChevronRight, ArrowLeft } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-gray-100 text-gray-600" },
  SCHEDULED: { label: "Agendado", cls: "bg-blue-100 text-blue-700" },
  SENDING: { label: "Enviando", cls: "bg-yellow-100 text-yellow-700" },
  SENT: { label: "Enviado", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "Falhou", cls: "bg-red-100 text-red-700" },
};

export default async function CampaignsListPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  if (!(await isAdminAuthenticated())) redirect("/");

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        subject: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        openCount: true,
        createdAt: true,
      },
    }),
    prisma.campaign.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mt-12" />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/newsletter"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
              <p className="text-gray-500 text-sm">{total} no total</p>
            </div>
          </div>
          <Link
            href="/admin/newsletter/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2.5
                       bg-green-600 text-white rounded-lg font-semibold text-sm
                       hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova campanha
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Assunto
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Enviados
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Abertura
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Data
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.map((c) => {
                const badge = STATUS_LABELS[c.status] ?? STATUS_LABELS.DRAFT;
                const openRate =
                  c.sentCount > 0
                    ? `${((c.openCount / c.sentCount) * 100).toFixed(1)}%`
                    : "—";
                const date = c.sentAt ?? c.scheduledAt ?? c.createdAt;

                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/newsletter/campaigns/${c.id}`}
                        className="font-medium text-gray-900 hover:text-green-600 transition-colors line-clamp-1"
                      >
                        {c.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600 font-medium hidden md:table-cell">
                      {c.sentCount.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600 font-medium hidden md:table-cell">
                      {openRate}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-400 hidden lg:table-cell">
                      {new Date(date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/newsletter/campaigns/${c.id}`}>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {campaigns.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">
              Nenhuma campanha criada ainda.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Próxima →
              </Link>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
