// portfolio/lib/backups/ops-password.ts

import bcrypt from "bcryptjs";
import { getRedis } from "@/lib/redis";

/**
 * Senha operacional para ações sensíveis (download/exclusão de backups).
 *
 * Camadas de segurança:
 *   1. Usuário precisa estar autenticado como admin (requireAdmin)
 *   2. Senha operacional separada da senha de login (defesa em profundidade)
 *   3. Hash bcrypt (nunca comparação em texto plano)
 *   4. Rate limit agressivo: 3 tentativas → bloqueio de 15 min
 *   5. Tentativas falhas logadas para auditoria
 */

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutos
const ATTEMPT_WINDOW_SECONDS = 15 * 60;

function attemptsKey(userId: string) {
  return `backup:ops:attempts:${userId}`;
}

function lockoutKey(userId: string) {
  return `backup:ops:lockout:${userId}`;
}

export interface OpsPasswordResult {
  ok: boolean;
  reason?: "missing_password" | "not_configured" | "locked_out" | "invalid";
  retryAfterSeconds?: number;
}

/**
 * Verifica se a senha operacional é válida.
 * Aplica rate limit por usuário.
 */
export async function verifyOpsPassword(
  userId: string,
  password: string | undefined,
): Promise<OpsPasswordResult> {
  if (!password || typeof password !== "string" || password.length > 200) {
    return { ok: false, reason: "missing_password" };
  }

  const hash = process.env.BACKUP_OPS_PASSWORD_HASH;
  if (!hash) {
    // Fail-closed: se a env não está configurada, nega acesso
    console.error("[backups] BACKUP_OPS_PASSWORD_HASH não configurada");
    return { ok: false, reason: "not_configured" };
  }

  const redis = getRedis();

  // 1. Verifica lockout
  const lockTtl = await redis.ttl(lockoutKey(userId));
  if (lockTtl > 0) {
    return { ok: false, reason: "locked_out", retryAfterSeconds: lockTtl };
  }

  // 2. Compara senha via bcrypt
  const match = await bcrypt.compare(password, hash);

  if (!match) {
    // Incrementa contador de tentativas
    const attempts = await redis.incr(attemptsKey(userId));
    if (attempts === 1) {
      await redis.expire(attemptsKey(userId), ATTEMPT_WINDOW_SECONDS);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await redis.set(lockoutKey(userId), "1", "EX", LOCKOUT_SECONDS);
      await redis.del(attemptsKey(userId));
      console.warn(
        `[backups] user ${userId} bloqueado após ${attempts} tentativas`,
      );
      return { ok: false, reason: "locked_out", retryAfterSeconds: LOCKOUT_SECONDS };
    }

    return { ok: false, reason: "invalid" };
  }

  // 3. Sucesso — zera contador
  await redis.del(attemptsKey(userId));
  return { ok: true };
}

/**
 * Helper para gerar o hash via CLI uma única vez:
 *
 *   node -e "import('bcryptjs').then(b => b.default.hash('sua_senha_forte_aqui', 12).then(console.log))"
 *
 * Copia o hash resultante para BACKUP_OPS_PASSWORD_HASH no .env
 */
export async function hashOpsPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
