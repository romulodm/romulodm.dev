// src/lib/email/providers/ses.provider.ts

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { EmailProvider, SendEmailOptions, SendResult } from "./base.provider";

export class SesProvider implements EmailProvider {
    readonly name = "ses";

    private client: SESClient;
    private fromAddress: string;
    private fromName: string;

    constructor() {
        this.fromAddress =
            process.env.SES_FROM ??
            process.env.SMTP_FROM ??
            "noreply@romulodm.dev";

        this.fromName = process.env.EMAIL_FROM_NAME ?? "Newsletter";

        this.client = new SESClient({
            region: process.env.AWS_REGION ?? "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }

    async send(opts: SendEmailOptions): Promise<SendResult> {
        const from = opts.from ?? `"${this.fromName}" <${this.fromAddress}>`;

        // opts.headers is NOT sent: the classic SES SendEmail API has no field
        // for custom headers, so List-Unsubscribe is lost on this path. Only
        // SendRawEmail (hand-built MIME) or the SESv2 client can carry it. Fine
        // while SES is only the overflow fallback behind Resend; worth fixing
        // before SES carries campaigns on its own, since Gmail and Yahoo expect
        // one-click unsubscribe on bulk mail.
        const command = new SendEmailCommand({
            Source: from,
            Destination: { ToAddresses: [opts.to] },
            Message: {
                Subject: { Data: opts.subject, Charset: "UTF-8" },
                Body: { Html: { Data: opts.html, Charset: "UTF-8" } },
            },
            ...(opts.replyTo ? { ReplyToAddresses: [opts.replyTo] } : {}),
        });

        const result = await this.client.send(command);

        return { messageId: result.MessageId ?? "", success: true };
    }

    async verify(): Promise<boolean> {
        // A verificação real acontece na primeira chamada send().
        // Opcionalmente, você pode chamar GetSendQuotaCommand aqui para
        // confirmar que as credenciais são válidas durante o boot.
        return true;
    }
}

