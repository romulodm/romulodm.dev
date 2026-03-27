// src/lib/email/providers/base.provider.ts

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  messageId?: string;
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
