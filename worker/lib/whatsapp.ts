// src/lib/whatsapp.ts
import { prisma } from "@romulo/database";

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

// ── Types ──────────────────────────────────────────────────────────────────

interface UmamiStats {
  visitors: { value: number };
  pageviews: { value: number };
  totaltime: { value: number };
  visits: { value: number };
  bounces: { value: number };
}

interface UmamiMetric {
  x: string;
  y: number;
}

// ── Umami Auth ─────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getUmamiToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const res = await fetch(`${process.env.UMAMI_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.UMAMI_USER,
      password: process.env.UMAMI_PASSWORD,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Umami login falhou ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { token: string };

  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000, // 23h para folga
  };

  return cachedToken.value;
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

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startAt = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
  const endAt = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();

  console.log("[sendDailyStatus] Intervalo:", {
    startAt: new Date(startAt).toISOString(),
    endAt: new Date(endAt).toISOString(),
  });

  console.log("[sendDailyStatus] Obtendo token Umami…");
  const token = await getUmamiToken();
  console.log("[sendDailyStatus] Token obtido com sucesso.");
  const umamiHeaders = { Authorization: `Bearer ${token}` };

  // ── Umami: site stats ────────────────────────────────────────────────────
  const statsUrl =
    `${process.env.UMAMI_URL}/api/websites/${process.env.UMAMI_SITE_ID}/stats` +
    `?startAt=${startAt}&endAt=${endAt}`;
  console.log("[sendDailyStatus] Buscando stats:", statsUrl);
  const statsRes = await fetch(statsUrl, { headers: umamiHeaders });
  console.log("[sendDailyStatus] Stats HTTP status:", statsRes.status);
  const stats = (await statsRes.json()) as UmamiStats;
  console.log("[sendDailyStatus] Stats payload:", JSON.stringify(stats));

  // ── Prisma: engagement + newsletter ──────────────────────────────────────
  const since = new Date(startAt);
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

  const avgTime =
    stats.visitors?.value > 0
      ? Math.round((stats.totaltime?.value ?? 0) / stats.visitors.value)
      : 0;

  const message =
    `📊 *Resumo de ontem*\n\n` +
    `👥 Visitantes: ${stats.visitors?.value ?? 0}\n` +
    `👀 Pageviews: ${stats.pageviews?.value ?? 0}\n` +
    `⏱️ Tempo médio: ${avgTime}s\n\n` +
    `🔗 Umami: ${process.env.UMAMI_SHARED_URL}\n` +
    `❤️ Likes: ${likes}\n💬 Comentários: ${comments}\n\n` +
    `📧 *Newsletter:*\n` +
    `  Novos inscritos: ${newSubscribers}\n` +
    `  Total ativos: ${totalSubscribers}`;

  console.log("[sendDailyStatus] Enviando mensagem…");
  await sendText(message);
  console.log("[sendDailyStatus] Concluído.");
}