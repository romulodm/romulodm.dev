// src/app/admin/newsletter/campaigns/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth-helpers";
import Navbar from "@/components/navigation/Navbar";
import { prisma } from "@romulo/database";
import { ArrowLeft, Send, Users, MailOpen, AlertTriangle, TrendingUp } from "lucide-react";
import CampaignForm from "../CampaignForm";
import DeleteCampaignButton from "./DeleteCampaignButton";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Rascunho", cls: "bg-gray-100 text-gray-600" },
  SCHEDULED: { label: "Agendado", cls: "bg-blue-100 text-blue-700" },
  SENDING: { label: "Enviando", cls: "bg-yellow-100 text-yellow-700" },
  SENT: { label: "Enviado", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "Falhou", cls: "bg-red-100 text-red-700" },
};

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!(await isAdminAuthenticated())) redirect("/");

  const [campaign, deliveryBreakdown] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: params.id },
    }),
    prisma.campaignRecipient.groupBy({
      by: ["status"],
      where: { campaignId: params.id },
      _count: { status: true },
    }),
  ]);

  if (!campaign) notFound();

  const badge = STATUS_LABELS[campaign.status] ?? STATUS_LABELS.DRAFT;
  const openRate =
    campaign.sentCount > 0
      ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1)
      : "0.0";

  const deliveryMap = Object.fromEntries(
    deliveryBreakdown.map((b) => [b.status, b._count.status]),
  );

  const isDraft = campaign.status === "DRAFT";
  const isSent = campaign.status === "SENT";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mt-12" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/newsletter/campaigns"
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 line-clamp-1">
                  {campaign.subject}
                </h1>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Criado em{" "}
                {new Date(campaign.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {campaign.status !== "SENDING" && (
            <DeleteCampaignButton campaignId={params.id} />
          )}
        </div>

        {/* Metrics (only when sent/sending) */}
        {(isSent || campaign.status === "SENDING") && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total",
                value: campaign.totalRecipients.toLocaleString("pt-BR"),
                icon: Users,
                color: "text-gray-600",
                bg: "bg-gray-50",
              },
              {
                label: "Enviados",
                value: campaign.sentCount.toLocaleString("pt-BR"),
                icon: Send,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Aberturas",
                value: campaign.openCount.toLocaleString("pt-BR"),
                icon: MailOpen,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Taxa de abertura",
                value: `${openRate}%`,
                icon: TrendingUp,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Falhas",
                value: campaign.failedCount.toLocaleString("pt-BR"),
                icon: AlertTriangle,
                color: "text-red-500",
                bg: "bg-red-50",
              },
            ].slice(0, 4).map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Delivery breakdown bar (when sent) */}
        {isSent && campaign.totalRecipients > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Status de entrega
            </h3>
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-3">
              {deliveryMap["SENT"] && (
                <div
                  className="bg-green-500 h-full transition-all"
                  style={{
                    width: `${(deliveryMap["SENT"] / campaign.totalRecipients) * 100}%`,
                  }}
                />
              )}
              {deliveryMap["FAILED"] && (
                <div
                  className="bg-red-400 h-full transition-all"
                  style={{
                    width: `${(deliveryMap["FAILED"] / campaign.totalRecipients) * 100}%`,
                  }}
                />
              )}
              {deliveryMap["PENDING"] && (
                <div
                  className="bg-yellow-300 h-full transition-all"
                  style={{
                    width: `${(deliveryMap["PENDING"] / campaign.totalRecipients) * 100}%`,
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {Object.entries(deliveryMap).map(([status, count]) => (
                <span key={status}>
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${status === "SENT"
                        ? "bg-green-500"
                        : status === "FAILED"
                          ? "bg-red-400"
                          : "bg-yellow-300"
                      }`}
                  />
                  {status === "SENT" ? "Entregues" : status === "FAILED" ? "Falhas" : "Pendentes"}:{" "}
                  <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Edit form (only DRAFT) */}
        {isDraft && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Editar campanha
            </h2>
            <CampaignForm
              mode="edit"
              campaign={{
                id: campaign.id,
                subject: campaign.subject,
                previewText: campaign.previewText ?? undefined,
                content: campaign.content,
              }}
            />
          </div>
        )}

        {/* Read-only preview (non-draft) */}
        {!isDraft && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Conteúdo enviado
            </h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: campaign.content }}
            />
          </div>
        )}

      </main>
    </div>
  );
}
