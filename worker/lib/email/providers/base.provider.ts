// src/lib/email/providers/base.provider.ts

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  messageId?: string;
  /**
   * Extra MIME headers, e.g. List-Unsubscribe / List-Unsubscribe-Post for
   * mailing-list sends (see listUnsubscribeHeaders in email.worker.ts).
   * Honoured by ResendProvider and SmtpProvider; SesProvider drops them, see
   * the note there.
   */
  headers?: Record<string, string>;
  /**
   * True quando essa é a última tentativa que o BullMQ vai fazer desse job
   * (ver `isFinalAttempt()` em email.worker.ts). O FallbackProvider usa isso
   * pra decidir se vale esperar mais uma rodada de retry — idempotente,
   * graças ao `Idempotency-Key` do ResendProvider — antes de arriscar mandar
   * o mesmo email pelos dois provedores num erro ambíguo (timeout/rede).
   */
  isFinalAttempt?: boolean;
}

export interface SendResult {
  messageId: string;
  success: boolean;
}

export interface EmailProvider {
  readonly name: string;
  send(options: SendEmailOptions): Promise<SendResult>;
  verify?(): Promise<boolean>;
}
