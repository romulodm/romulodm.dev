'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface UsePostInteractionsOptions {
    postId: string;
    initialLikes: number;
    initialViews: number;
    initialComments: number;
    initialLiked?: boolean;
}

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers or non-secure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getOrCreateSessionId(): string {
    const key = 'blog_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = generateUUID();
        sessionStorage.setItem(key, id);
    }
    return id;
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
    const viewSentRef = useRef(false);

    // Verificar se o usuário já curtiu ao montar (se logado)
    useEffect(() => {
        if (!session?.user?.id) return;
        fetch(`/api/posts/${postId}/like`)
            .then((r) => r.json())
            .then((d) => setLiked(d.liked ?? false))
            .catch(() => { });
    }, [postId, session?.user?.id]);

    // Registrar visualização uma vez por mount
    useEffect(() => {
        if (viewSentRef.current) return;
        viewSentRef.current = true;

        const identifier = session?.user?.id || getOrCreateSessionId();

        fetch(`/api/posts/${postId}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session?.user?.id, sessionId: identifier }),
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.counted) setViews((v) => v + 1);
            })
            .catch(() => { });
    }, [postId, session?.user?.id]);

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