'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

import { postLikeStateUrl } from '@/lib/post-like-state';

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

interface LikeState {
    liked: boolean;
    likes: number;
}

/**
 * Live `{ liked, likes }` for the current visitor, shared by the two instances of
 * this hook on a post page, like `inFlightViews` above.
 *
 * Fetched on mount without waiting for `useSession`: the route resolves the
 * session from the cookie itself. Waiting for next-auth first meant two
 * sequential round trips (`/api/auth/session`, then this) after hydration,
 * which is why the heart used to fill in seconds after the page appeared. The
 * post page also preloads this exact URL, so this call normally resolves from
 * the preload instead of going to the network.
 */
const inFlightLikeState = new Map<string, Promise<LikeState | null>>();

function fetchLikeState(postId: string): Promise<LikeState | null> {
    let pending = inFlightLikeState.get(postId);

    if (!pending) {
        pending = fetch(postLikeStateUrl(postId))
            .then((r) => (r.ok ? r.json() : null))
            .then((d) =>
                d && typeof d.likes === 'number'
                    ? { liked: d.liked === true, likes: d.likes }
                    : null,
            )
            .catch(() => null)
            .finally(() => inFlightLikeState.delete(postId));
        inFlightLikeState.set(postId, pending);
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
    const { data: session, status } = useSession();
    const [likes, setLikes] = useState(initialLikes);
    const [views, setViews] = useState(initialViews);
    const [comments] = useState(initialComments);
    const [liked, setLiked] = useState(initialLiked);
    const [likeLoading, setLikeLoading] = useState(false);

    // The count in `initialLikes` comes from the cached page and can be stale;
    // whether this visitor liked the post is not in the page at all. Both come
    // from fetchLikeState (see above), once per post on mount.
    const [likeStateVersion, setLikeStateVersion] = useState(0);
    useEffect(() => {
        let active = true;

        fetchLikeState(postId).then((state) => {
            if (!active || !state) return;
            setLiked(state.liked);
            setLikes(state.likes);
        });

        return () => {
            active = false;
        };
    }, [postId, likeStateVersion]);

    // Signing in or out without a reload (the auth modal) changes the answer,
    // so the state is fetched again. The first resolution of the session
    // ('loading' -> known) is not a change: the mount fetch above already sent
    // the cookie, and refetching there would double the request on every load.
    const userId = status === 'loading' ? undefined : (session?.user?.id ?? null);
    const lastUserId = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        if (userId === undefined) return;
        if (lastUserId.current !== undefined && lastUserId.current !== userId) {
            setLikeStateVersion((v) => v + 1);
        }
        lastUserId.current = userId;
    }, [userId]);

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