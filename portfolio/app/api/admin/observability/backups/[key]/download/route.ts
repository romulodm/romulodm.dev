// portfolio/app/api/admin/backups/[key]/download/route.ts
//
// Nota: usa POST ao invés de GET intencionalmente:
//   - GET com senha no body não é idiomático
//   - GET com senha em query string vaza em logs/histórico do browser
//   - POST permite body JSON com a senha e retorna URL presignada

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
  getBackupDownloadUrl,
  isValidBackupKey,
} from "@/lib/backups/s3-client";
import { verifyOpsPassword } from "@/lib/backups/ops-password";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.reason === "unauthorized"
      ? unauthorizedResponse()
      : forbiddenResponse();
  }

  // Decodifica a key (vem URL-encoded porque contém /)
  const { key: rawKey } = await context.params;
  const key = decodeURIComponent(rawKey);

  if (!isValidBackupKey(key)) {
    return badRequestResponse("Chave de backup inválida.");
  }

  // Senha operacional no body (não em query para não vazar)
  let password: string | undefined;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return badRequestResponse("Corpo da requisição inválido.");
  }

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
    const url = await getBackupDownloadUrl(key);
    console.log(
      `[backups] AUDIT download_granted user=${auth.user.id} key=${key} at=${new Date().toISOString()}`,
    );
    return NextResponse.json({ url, expiresIn: 300 });
  } catch (err) {
    return internalErrorResponse("backups.download", err, undefined, { key });
  }
}
