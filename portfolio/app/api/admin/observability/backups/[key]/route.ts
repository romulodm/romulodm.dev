// portfolio/app/api/admin/backups/[key]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  badRequestResponse,
  forbiddenResponse,
  internalErrorResponse,
  rateLimitResponse,
  unauthorizedResponse,
} from "@/lib/api-errors";
import {
  deleteBackup,
  isValidBackupKey,
} from "@/lib/backups/s3-client";
import { verifyOpsPassword } from "@/lib/backups/ops-password";

// ── DELETE /api/admin/backups/[key] — exclui backup ──────────────────────────
// Next.js não permite body em DELETE em todos os runtimes.
// Usa-se x-ops-password no header para passar a senha.

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.reason === "unauthorized"
      ? unauthorizedResponse()
      : forbiddenResponse();
  }

  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);

  if (!isValidBackupKey(key)) {
    return badRequestResponse("Chave de backup inválida.");
  }

  const password = req.headers.get("x-ops-password") ?? undefined;

  const check = await verifyOpsPassword(auth.user.id, password);
  if (!check.ok) {
    switch (check.reason) {
      case "locked_out":
        return rateLimitResponse(
          `Muitas tentativas. Tente novamente em ${Math.ceil(
            (check.retryAfterSeconds ?? 900) / 60,
          )} minutos.`,
        );
      case "missing_password":
        return badRequestResponse("Senha operacional obrigatória.");
      case "not_configured":
        return forbiddenResponse("Operação indisponível no momento.");
      default:
        return forbiddenResponse("Senha operacional inválida.");
    }
  }

  try {
    await deleteBackup(key);
    console.log(
      `[backups] AUDIT delete user=${auth.user.id} key=${key} at=${new Date().toISOString()}`,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return internalErrorResponse("backups.delete", err, undefined, { key });
  }
}
