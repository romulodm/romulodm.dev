// src/app/admin/newsletter/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import Navbar from "@/components/navigation/Navbar";
import { prisma } from "@romulo/database";
import {
  Users,
  MailCheck,
  Clock,
  UserMinus,
  Send,
  TrendingUp,
  Plus,
  ChevronRight,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-gray-100 text-gray-600" },
  SCHEDULED: { label: "Agendado", cls: "bg-blue-100 text-blue-700" },
  SENDING: { label: "Enviando", cls: "bg-yellow-100 text-yellow-700" },
  SENT: { label: "Enviado", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "Falhou", cls: "bg-red-100 text-red-700" },
};

// ── Page (server component) ──────────────────────────────────────────────────

export default async function AdminNewsletterPage() {
  if (!(await isAdminAuthenticated())) redirect("/");

  // Fetch all data in parallel
  const [
    totalSubscribers,
    confirmedSubscribers,
    pendingSubscribers,
    unsubscribedCount,
    recentCampaigns,
    campaignMetrics,
  ] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({
      where: { isConfirmed: true, unsubscribedAt: null },
    }),
    prisma.newsletterSubscriber.count({ where: { isConfirmed: false } }),
    prisma.newsletterSubscriber.count({
      where: { unsubscribedAt: { not: null } },
    }),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        subject: true,
        status: true,
        sentAt: true,
        scheduledAt: true,
        totalRecipients: true,
        sentCount: true,
        openCount: true,
        createdAt: true,
      },
    }),
    prisma.campaign.aggregate({
      _sum: { sentCount: true, openCount: true },
    }),
  ]);

  const totalSent = campaignMetrics._sum.sentCount ?? 0;
  const totalOpens = campaignMetrics._sum.openCount ?? 0;
  const overallOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;

  const stats = [
    {
      label: "Inscritos ativos",
      value: formatNumber(confirmedSubscribers),
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Aguardando confirmação",
      value: formatNumber(pendingSubscribers),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Descadastros",
      value: formatNumber(unsubscribedCount),
      icon: UserMinus,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Taxa de abertura geral",
      value: formatPercent(overallOpenRate),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mt-12" />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {formatNumber(totalSubscribers)} inscritos no total
            </p>
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

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-medium">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Campaign section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-gray-400" />
              Campanhas recentes
            </h2>
            <Link
              href="/admin/newsletter/campaigns"
              className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1"
            >
              Ver todas
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MailCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhuma campanha ainda</p>
              <p className="text-xs mt-1">
                Crie sua primeira campanha para começar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentCampaigns.map((c) => {
                const openRate =
                  c.sentCount > 0
                    ? ((c.openCount / c.sentCount) * 100).toFixed(1)
                    : "—";
                const badge = STATUS_LABELS[c.status] ?? STATUS_LABELS.DRAFT;

                return (
                  <Link
                    key={c.id}
                    href={`/admin/newsletter/campaigns/${c.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Status dot */}
                    <div className="shrink-0 w-2 h-2 rounded-full bg-green-500 mt-0.5" />

                    {/* Subject + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c.subject}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.sentAt
                          ? new Date(c.sentAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : c.scheduledAt
                            ? `Agendado: ${new Date(c.scheduledAt).toLocaleDateString("pt-BR")}`
                            : new Date(c.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">
                          {formatNumber(c.sentCount)}
                        </p>
                        <p className="text-xs">enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{openRate}%</p>
                        <p className="text-xs">abertura</p>
                      </div>
                    </div>

                    {/* Badge */}
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>

                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
