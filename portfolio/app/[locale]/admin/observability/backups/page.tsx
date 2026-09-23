// portfolio/app/[locale]/admin/backups/page.tsx

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { isAdminAuthenticated } from "@/lib/auth-helpers";
import { listBackups } from "@/lib/backups/s3-client";
import { BackupsClient } from "@/components/admin/observability/BackupsClient";

export default async function AdminBackupsPage() {
  const locale = await getLocale();

  if (!(await isAdminAuthenticated())) {
    redirect(`/${locale}`);
  }

  // Busca inicial no servidor — cliente revalida quando necessário
  let initialBackups: Awaited<ReturnType<typeof listBackups>> = [];
  let initialError: string | null = null;

  try {
    initialBackups = await listBackups();
  } catch (err) {
    initialError = err instanceof Error ? err.message : "Erro ao listar backups";
    console.error("[backups.page]", err);
  }

  return (
    <BackupsClient initialBackups={initialBackups} initialError={initialError} />
  );
}
