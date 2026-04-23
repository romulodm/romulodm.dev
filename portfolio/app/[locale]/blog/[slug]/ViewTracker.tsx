// apps/web/src/app/[locale]/blog/[slug]/ViewTracker.tsx
//
// Componente client leve que dispara a server action de view uma vez por mount.
// Mantém o PostPage como Server Component (sem "use client" nele).

"use client";

import { useEffect, useRef } from "react";
import { recordPostView } from "@/lib/views";

interface ViewTrackerProps {
    postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;
        recordPostView(postId);
    }, [postId]);

    return null;
}