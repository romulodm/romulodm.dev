"use client";

import { whenSentryLoaded } from "@/lib/sentry-client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function SentryUserContext() {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "loading") return;

        const userId = (session?.user as { id?: string } | undefined)?.id;

        // Waits for the deferred SDK instead of loading it just for this.
        whenSentryLoaded((Sentry) => Sentry.setUser(userId ? { id: userId } : null));
    }, [session, status]);

    return null;
}
