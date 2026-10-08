'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UsePostInteractionsOptions {
    postId: string;
    initialLikes: number;
    initialViews: number;
    initialComments: number;
    initialLiked?: boolean;
}

/**
 * One page load is one view, but this hook is mounted twice on a post page:
 * by the desktop sidebar and by the mobile bar (both stay mounted, CSS only
 * hides one). The two instances share a single request per post through this
 * map. The entry is removed once the request settles, so opening the same
 * post again later, including through client-side navigation, counts again.
 *
 * The request carries no body: the server resolves the reader on its own
 * (see `lib/views-internal.ts`).
 */
const inFlightViews = new Map<string, Promise<boolean>>();

function recordView(postId: string): Promise<boolean> {
    let pending = inFlightViews.get(postId);

    if (!pending) {
        pending = fetch(`/api/posts/${postId}/view`, { method: 'POST' })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d?.counted === true)
            .catch(() => false)
            .finally(() => inFlightViews.delete(postId));
        inFlightViews.set(postId, pending);
    }

    return pending;
}

export function usePostInteractions({
    postId,
    initialLikes,
    initialViews,
    initialComments,
    initialLiked = false,
}: UsePostInteractionsOptions) {
    const { data: session } = useSession();
    const [likes, setLikes] = useState(initialLikes);
    const [views, setViews] = useState(initialViews);
    const [comments] = useState(initialComments);
    const [liked, setLiked] = useState(initialLiked);
    const [likeLoading, setLikeLoading] = useState(false);

    // Verificar se o usuário já curtiu ao montar (se logado)
    useEffect(() => {
        if (!session?.user?.id) return;
        fetch(`/api/posts/${postId}/like`)
            .then((r) => r.json())
            .then((d) => setLiked(d.liked ?? false))
            .catch(() => { });
    }, [postId, session?.user?.id]);

    // Uma visualização por carregamento do post (ver recordView acima).
    useEffect(() => {
        let active = true;

        recordView(postId).then((counted) => {
            if (counted && active) setViews((v) => v + 1);
        });

        return () => {
            active = false;
        };
    }, [postId]);

    const toggleLike = useCallback(async () => {
        if (!session?.user?.id) {
            // Redirecionar para login ou mostrar modal
            window.location.href = '/auth/login';
            return;
        }
        if (likeLoading) return;

        // Optimistic update
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikes((l) => (wasLiked ? l - 1 : l + 1));
        setLikeLoading(true);

        try {
            const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setLiked(data.liked);
            setLikes(data.likes);
        } catch {
            // Reverter em caso de erro
            setLiked(wasLiked);
            setLikes((l) => (wasLiked ? l + 1 : l - 1));
        } finally {
            setLikeLoading(false);
        }
    }, [postId, liked, likeLoading, session?.user?.id]);

    return { likes, views, comments, liked, likeLoading, toggleLike };
}