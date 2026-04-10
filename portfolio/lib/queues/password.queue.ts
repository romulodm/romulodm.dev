// src/lib/mail.ts
import { transactionalQueue } from "@/lib/queues/email.queue";
import {
    buildTransactionalJobId,
    transactionalEmailJobOptions,
    type TransactionalEmailJob,
} from "@romulo/queues";

export async function sendPasswordResetEmail(email: string, token: string) {
    const job: TransactionalEmailJob = {
        type: "PASSWORD_RESET",
        email,
        code: token,
        expiresInMinutes: 60,
    };

    await transactionalQueue.add(
        "password-reset",
        job,
        {
            ...transactionalEmailJobOptions,
            jobId: buildTransactionalJobId(job),
        },
    );
}
