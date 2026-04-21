// portfolio/components/admin/BackupsClient.tsx

"use client";

import { useState, useTransition } from "react";
import {
  Database,
  Download,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

interface BackupItem {
  key: string;
  filename: string;
  size: number;
  createdAt: string;
}

interface Props {
  initialBackups: BackupItem[];
  initialError: string | null;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BackupsClient({ initialBackups, initialError }: Props) {
  const [backups, setBackups] = useState<BackupItem[]>(initialBackups);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  // Modal de senha — usado tanto para download quanto para exclusão
  const [passwordModal, setPasswordModal] = useState<
    | { action: "download"; backup: BackupItem }
    | { action: "delete"; backup: BackupItem }
    | null
  >(null);
  const [password, setPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function refresh() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/observability/backups", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao buscar backups");
        const data = await res.json();
        setBackups(data.backups);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    });
  }

  async function createBackup() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/observability/backups", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Falha ao criar backup");
      }
      // Backup é assíncrono — aguarda 3s e recarrega
      setTimeout(() => {
        refresh();
        setCreating(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setCreating(false);
    }
  }

  function openPasswordModal(action: "download" | "delete", backup: BackupItem) {
    setPasswordModal({ action, backup } as typeof passwordModal);
    setPassword("");
    setModalError(null);
  }

  function closeModal() {
    setPasswordModal(null);
    setPassword("");
    setModalError(null);
    setActionLoading(false);
  }

  async function confirmAction() {
    if (!passwordModal || !password) {
      setModalError("Digite a senha operacional");
      return;
    }

    setActionLoading(true);
    setModalError(null);

    try {
      if (passwordModal.action === "download") {
        const encodedKey = encodeURIComponent(passwordModal.backup.key);
        const res = await fetch(`/api/admin/observability/backups/${encodedKey}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Falha ao gerar link");

        // Dispara download usando a URL presignada
        window.location.href = data.url;
        closeModal();
      } else {
        // delete
        const encodedKey = encodeURIComponent(passwordModal.backup.key);
        const res = await fetch(`/api/admin/observability/backups/${encodedKey}`, {
          method: "DELETE",
          headers: { "x-ops-password": password },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? "Falha ao excluir");
        }

        // Remove da lista local
        setBackups((prev) =>
          prev.filter((b) => b.key !== passwordModal.backup.key),
        );
        closeModal();
      }
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Erro desconhecido");
      setActionLoading(false);
    }
  }

  return (
    <main className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {backups.length} {backups.length === 1 ? "backup" : "backups"} no S3
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isPending ? "animate-spin" : ""}
            />
            Atualizar
          </button>

          <button
            onClick={createBackup}
            disabled={creating}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {creating ? "Criando..." : "Novo backup"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
        <Lock size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <div className="text-muted-foreground">
          <strong className="text-foreground">Segurança:</strong> download e
          exclusão exigem senha operacional separada do login. Após 3 tentativas
          inválidas, o acesso é bloqueado por 15 minutos.
        </div>
      </div>

      {/* Backups list */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Backups disponíveis
          </h2>
        </div>

        {backups.length === 0 ? (
          <div className="py-16 text-center">
            <Database className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">
              Nenhum backup encontrado
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique em &quot;Novo backup&quot; para criar o primeiro
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {backups.map((backup) => (
              <div
                key={backup.key}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {backup.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(backup.createdAt)} · {formatSize(backup.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openPasswordModal("download", backup)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Download (requer senha)"
                  >
                    <Download size={15} />
                  </button>

                  <button
                    onClick={() => openPasswordModal("delete", backup)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    title="Excluir (requer senha)"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password modal */}
      {passwordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !actionLoading) closeModal();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${passwordModal.action === "delete"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-primary/10 text-primary"
                    }`}
                >
                  {passwordModal.action === "delete" ? (
                    <Trash2 size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {passwordModal.action === "delete"
                      ? "Excluir backup"
                      : "Download de backup"}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {passwordModal.backup.filename}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                confirmAction();
              }}
              className="space-y-4 p-5"
            >
              {passwordModal.action === "delete" && (
                <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-500">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    Esta ação é <strong>irreversível</strong>. O arquivo será
                    removido permanentemente do S3.
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Senha operacional
                </label>
                <input
                  type="password"
                  autoFocus
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={actionLoading}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/30 disabled:opacity-50"
                />
              </div>

              {modalError && (
                <div className="text-xs text-red-500">{modalError}</div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={actionLoading}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !password}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${passwordModal.action === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-primary/90"
                    }`}
                >
                  {actionLoading && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {passwordModal.action === "delete"
                    ? "Excluir"
                    : "Gerar link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
