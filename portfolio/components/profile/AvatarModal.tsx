"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { SEEDICON_STYLES } from "seedicon";
import { Avatar } from "seedicon/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  generateAvatarSeed,
  type AvatarSourceValue,
  type AvatarUser,
} from "@/lib/avatar";

/**
 * Editor do avatar.
 *
 * A regra central: trocar de UUID e de estilo e de graca e ilimitado, porque
 * acontece inteiramente aqui no cliente — o seedicon gera SVG sincronamente, sem
 * rede e sem canvas. So "Salvar" fala com o servidor, e e so isso que o
 * rate limit conta. Cancelar joga o rascunho fora e volta ao que esta no banco.
 */

type AvatarDraft = {
  seed: string;
  style: string;
  source: AvatarSourceValue;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AvatarUser;
  /** Chamado com os valores salvos, para o header trocar na hora. */
  onSaved: (next: AvatarDraft) => void;
}

type Status = "idle" | "saving" | "ok" | "error" | "rate_limited";

export function AvatarModal({ open, onOpenChange, user, onSaved }: Props) {
  const [draft, setDraft] = useState<AvatarDraft>({
    seed: user.avatarSeed,
    style: user.avatarStyle,
    source: user.avatarSource,
  });
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  // O avatar tambem aparece na navbar, que e client-side e le a sessao. Sem
  // este update() o JWT continuaria com o avatar antigo e a navbar so
  // trocaria de imagem num reload. Ver o callback `jwt` em lib/auth.ts: o
  // trigger "update" manda ele reler do banco.
  const { update: refreshSession } = useSession();

  // Reabrir o modal comeca do que esta salvo, nao do rascunho abandonado da
  // vez anterior.
  useEffect(() => {
    if (!open) return;
    setDraft({ seed: user.avatarSeed, style: user.avatarStyle, source: user.avatarSource });
    setStatus("idle");
    setCopied(false);
  }, [open, user.avatarSeed, user.avatarStyle, user.avatarSource]);

  const hasProviderPhoto = Boolean(user.image);
  const isDirty =
    draft.seed !== user.avatarSeed ||
    draft.style !== user.avatarStyle ||
    draft.source !== user.avatarSource;

  const previewUser: AvatarUser = {
    ...user,
    avatarSeed: draft.seed,
    avatarStyle: draft.style,
    avatarSource: draft.source,
  };

  async function copySeed() {
    try {
      await navigator.clipboard.writeText(draft.seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard bloqueado (contexto sem permissao). O campo e selecionavel
      // a mao, entao nao vale um erro na tela.
    }
  }

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (res.status === 429) {
        setStatus("rate_limited");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }

      onSaved(draft);
      await refreshSession();
      setStatus("ok");
      setTimeout(() => onOpenChange(false), 700);
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border">
        <DialogHeader>
          <DialogTitle>Imagem do perfil</DialogTitle>
          <DialogDescription>
            Seu avatar é gerado a partir de um UUID. Gere outro para trocar de
            imagem, ou escolha um estilo diferente.
          </DialogDescription>
        </DialogHeader>

        {/* ── Preview ──────────────────────────────────────────────────────── */}
        <div className="flex justify-center py-1">
          <UserAvatar user={previewUser} size={96} className="ring-2 ring-border" />
        </div>

        {/* ── Origem — só aparece para quem tem foto de provider ───────────── */}
        {hasProviderPhoto && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Imagem</label>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
              <SourceOption
                label="Foto da conta"
                active={draft.source === "PROVIDER"}
                onClick={() => setDraft((d) => ({ ...d, source: "PROVIDER" }))}
              />
              <SourceOption
                label="Avatar gerado"
                active={draft.source === "SEEDICON"}
                onClick={() => setDraft((d) => ({ ...d, source: "SEEDICON" }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sua foto do {user.image?.includes("github") ? "GitHub" : "Google"} fica
              guardada de qualquer jeito — você pode voltar para ela depois.
            </p>
          </div>
        )}

        {/* O UUID e o estilo só importam quando o avatar gerado está em uso. */}
        <fieldset
          disabled={draft.source === "PROVIDER"}
          className="space-y-4 disabled:opacity-40 transition-opacity"
        >
          {/* ── UUID ───────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">UUID</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={draft.seed}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-accent/40 font-mono text-xs focus:outline-none focus:border-primary transition-colors"
              />
              <IconButton onClick={copySeed} title="Copiar UUID">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </IconButton>
            </div>
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, seed: generateAvatarSeed() }))}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
            >
              <RefreshCw className="w-3 h-3" />
              Gerar novo UUID
            </button>
          </div>

          {/* ── Estilos ────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estilo</label>
            {/* Construído de SEEDICON_STYLES, não de uma lista escrita à mão:
                uma release nova do pacote aparece aqui sozinha. Cada opção
                renderiza o UUID do rascunho, então o usuário se vê em todos. */}
            <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {SEEDICON_STYLES.map((style) => {
                const active = draft.style === style;
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, style }))}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs transition-colors ${active
                      ? "border-primary text-foreground bg-accent/50"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/30"
                      }`}
                  >
                    <Avatar seed={draft.seed} style={style} size={22} shape="circle" />
                    <span className="truncate">{style}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>

        {/* ── Ações ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-1">
          {status === "rate_limited" && (
            <span className="text-xs text-red-500 mr-auto">
              Você trocou de avatar muitas vezes. Tente de novo mais tarde.
            </span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-500 mr-auto">Erro ao salvar.</span>
          )}
          {status === "ok" && (
            <span className="text-xs text-green-600 mr-auto flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Salvo!
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || status === "saving"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {status === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SourceOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${active
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:text-foreground"
        }`}
    >
      {label}
    </button>
  );
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="shrink-0 p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {children}
    </button>
  );
}
