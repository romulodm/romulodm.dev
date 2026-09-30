'use client';

/**
 * Aviso de transparência do formulário de contato.
 *
 * Isto é um AVISO, não um pedido de consentimento — e a diferença é jurídica,
 * não estética.
 *
 * A política de privacidade do site (seção 4) declara a base legal de
 * "responder mensagens de contato" como Art. 7º, V e IX da LGPD: execução de
 * procedimentos preliminares e legítimo interesse. Não é Art. 7º, I. As duas
 * únicas finalidades que a política marca como consentimento são a newsletter
 * e os sinais do Google no Analytics, e as duas têm um opt-in de verdade em
 * outro lugar.
 *
 * Um checkbox de "concordo com o tratamento dos meus dados" aqui trocaria uma
 * base legal sólida por uma frágil: consentimento é revogável a qualquer
 * momento, e consentimento obrigatório para enviar o formulário não é
 * livremente dado — ou seja, não valeria como consentimento e ainda teria
 * abandonado a base que valia.
 *
 * O que a lei realmente exige (LGPD art. 9º) é informar. É o que este
 * componente faz.
 */

import React from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

interface ContactPrivacyNoticeProps {
  /** Substitui as classes padrão, para encaixar em formulários com outro visual. */
  className?: string;
}

const DEFAULT_CLASS =
  'mt-3 flex items-start gap-2 text-center text-xs leading-relaxed text-gray-500 dark:text-neutral-400';

export function ContactPrivacyNotice({
  className,
}: ContactPrivacyNoticeProps): React.JSX.Element {
  const t = useTranslations('contact');

  return (
    <p className={className ?? DEFAULT_CLASS}>
      <span>
        {t.rich('privacy-notice', {
          link: (chunks) => (
            <Link
              href="/legal/privacy-policy"
              // Aba nova de propósito: o formulário mora dentro de um modal, e
              // navegar na mesma aba jogaria fora a mensagem que a pessoa
              // acabou de escrever.
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-primary"
            >
              {chunks}
            </Link>
          ),
        })}
      </span>
    </p>
  );
}