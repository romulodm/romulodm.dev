// portfolio/app/api/admin/backups/route.ts

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  forbiddenResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import { listBackups } from "@/lib/backups/s3-client";
import { Queue } from "bullmq";
import { QUEUE_NOTIFICATIONS, notificationJobOptions } from "@romulo/queues";
import { getRedisBullMQ } from "@/lib/redis";

// ── GET /api/admin/backups — lista backups ───────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.reason === "unauthorized"
      ? unauthorizedResponse()
      : forbiddenResponse();
  }

  try {
    const backups = await listBackups();
    return NextResponse.json({ backups, count: backups.length });
  } catch (err) {
    return internalErrorResponse("backups.list", err);
  }
}

// ── POST /api/admin/backups — cria novo backup ───────────────────────────────
// Criação NÃO precisa da senha operacional: é um write-only, não expõe dados.

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.reason === "unauthorized"
      ? unauthorizedResponse()
      : forbiddenResponse();
  }

  try {
    // Enfileira job para o worker executar pg_dump
    const queue = new Queue(QUEUE_NOTIFICATIONS, {
      connection: getRedisBullMQ(),
    });

    await queue.add(
      "create-backup",
      { type: "create-backup", requestedBy: auth.user.id },
      {
        ...notificationJobOptions,
        jobId: `backup:manual:${Date.now()}:${auth.user.id}`,
      },
    );

    await queue.close();

    console.log(`[backups] ${auth.user.id} solicitou novo backup`);
    return NextResponse.json({ ok: true, message: "Backup enfileirado" });
  } catch (err) {
    return internalErrorResponse("backups.create", err);
  }
}
