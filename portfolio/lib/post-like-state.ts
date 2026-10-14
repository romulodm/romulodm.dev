/**
 * URL of the per-visitor like state of a post ({ liked, likes }).
 *
 * Shared by the post page, which preloads it, and usePostInteractions, which
 * fetches it. A browser only reuses a preloaded response when the URL matches
 * exactly, so both sides must build it in the same place.
 */
export const postLikeStateUrl = (postId: string) => `/api/posts/${postId}/like`;
