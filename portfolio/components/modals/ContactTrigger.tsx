'use client';

/**
 * Atalhos de contato com assunto já definido.
 *
 * A ideia é que o contexto onde a pessoa está já diz o assunto. Quem clica em
 * "reportar um bug" no rodapé de um post não deveria ter que escolher "Report
 * de bug" num menu — o botão já sabe.
 *
 * Isso melhora o painel de contato tanto quanto a experiência: assunto vindo do
 * contexto é mais confiável que assunto escolhido à mão, porque ninguém erra o
 * campo por pressa.
 *
 * Uso:
 *
 *   <ContactTrigger topic="FREELANCE" className="minha-classe">
 *     Quero contratar
 *   </ContactTrigger>
 */

import React, { useState } from 'react';

import { ContactModal } from '@/components/modals/ContactModal';
import type { ContactTopicValue } from '@/lib/contact-topics';

const DEFAULT_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary/60 hover:text-primary dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-primary/60';

export interface ContactTriggerProps {
  /** Assunto pré-selecionado. Omitir abre o modal sem escolha feita. */
  topic?: ContactTopicValue;
  /** Título do modal. Padrão: a chamada genérica de contato. */
  title?: string;
  /** Subtítulo do modal. */
  description?: string;
  /** Substitui as classes padrão do botão inteiro. */
  className?: string;
  /** Conteúdo do botão: texto, ícone + texto, o que for. */
  children: React.ReactNode;
}

export function ContactTrigger({
  topic,
  title,
  description,
  className,
  children,
}: ContactTriggerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? DEFAULT_BUTTON_CLASS}
      >
        {children}
      </button>

      {/*
        Sem guarda de montagem aqui: o `DialogContent` de `components/ui/dialog`
        faz `if (!open) return null`, então o formulário — e com ele o widget do
        Turnstile — só existe no DOM enquanto o modal está aberto. Vários
        atalhos na mesma página não carregam vários desafios da Cloudflare.
      */}
      <ContactModal
        open={open}
        onOpenChange={setOpen}
        defaultTopic={topic}
        title={title}
        description={description}
      />
    </>
  );
}
