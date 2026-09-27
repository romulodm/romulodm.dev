// src/lib/whatsapp.ts
import { prisma } from "@romulo/database";
import { getDailyStats, yesterdayDate } from "./ga4";

const WAHA_URL = process.env.WAHA_URL!;
const CHAT_ID = process.env.WAHA_CHAT_ID!;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.WAHA_API_KEY) {
    headers["X-Api-Key"] = process.env.WAHA_API_KEY;
  }
  return headers;
}

// ── Core ───────────────────────────────────────────────────────────────────

async function sendText(text: string): Promise<void> {
  console.log("[sendText] getHeaders()", getHeaders());

  const res = await fetch(`${WAHA_URL}/api/sendText`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      chatId: CHAT_ID,
      text,
      reply_to: null,
      linkPreview: true,
      linkPreviewHighQuality: false,
      session: "default",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WAHA error ${res.status}: ${body}`);
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function notifyComment(comment: {
  id: string;
  author: string;
  postTitle: string;
  postSlug: string;
}): Promise<void> {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";

  const message =
    `💬 *Novo comentário!*\n\n` +
    `📝 Post: ${comment.postTitle}\n` +
    `👤 Por: ${comment.author}\n` +
    `🔗 Postagem: ${APP_URL}/blog/${comment.postSlug}\n` +
    `🔗 Comentário: ${APP_URL}/comments/${comment.id}`;

  await sendText(message);
}

export async function sendDailyStatus(): Promise<void> {
  console.log("[sendDailyStatus] Iniciando…");

  const date = yesterdayDate();
  console.log("[sendDailyStatus] Data de referência:", date);

  // ── GA4: site stats ──────────────────────────────────────────────────────
  console.log("[sendDailyStatus] Buscando stats no GA4…");
  const stats = await getDailyStats(date);
  console.log("[sendDailyStatus] Stats:", JSON.stringify(stats));

  // ── Prisma: engagement + newsletter ──────────────────────────────────────
  const since = new Date(`${date}T00:00:00`);
  console.log("[sendDailyStatus] Consultando Prisma desde:", since.toISOString());
  const [likes, comments, newSubscribers, totalSubscribers] = await Promise.all([
    prisma.postLike.count({ where: { createdAt: { gte: since } } }),
    prisma.comment.count({ where: { createdAt: { gte: since } } }),
    prisma.newsletterSubscriber.count({
      where: { isConfirmed: true, subscribedAt: { gte: since } },
    }),
    prisma.newsletterSubscriber.count({
      where: { isConfirmed: true, unsubscribedAt: null },
    }),
  ]);
  console.log("[sendDailyStatus] Prisma:", { likes, comments, newSubscribers, totalSubscribers });

  const message =
    `📊 *Resumo de ontem*\n\n` +
    `👥 Visitantes: ${stats.visitors}\n` +
    `👀 Pageviews: ${stats.pageviews}\n` +
    `⏱️ Tempo médio: ${stats.avgSessionDuration}s\n\n` +
    `❤️ Likes: ${likes}\n💬 Comentários: ${comments}\n\n` +
    `📧 *Newsletter:*\n` +
    `  Novos inscritos: ${newSubscribers}\n` +
    `  Total ativos: ${totalSubscribers}`;

  console.log("[sendDailyStatus] Enviando mensagem…");
  await sendText(message);
  console.log("[sendDailyStatus] Concluído.");
}