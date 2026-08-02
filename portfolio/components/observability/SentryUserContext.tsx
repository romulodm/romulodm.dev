"use client";

import * as Sentry from "@sentry/nextjs";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function SentryUserContext() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "loading") return;

        const userId = (session?.user as { id?: string } | undefined)?.id;

        if (userId) {
            Sentry.setUser({ id: userId });
            return;
        }

        Sentry.setUser(null);
    }, [session, status]);

    return null;
}
