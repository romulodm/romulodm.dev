import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

// ── Tipos ────────────────────────────────────────────────────────────────────

export type RouteAuthResult =
    | {
        ok: true;
        session: Session;
        user: Session["user"] & { id: string; admin: boolean };
    }
    | {
        ok: false;
        status: 401 | 403;
        reason: "unauthorized" | "forbidden";
    };

// ── Helpers internos ──────────────────────────────────────────────────────────

function getRouteUser(session: Session | null) {
    if (!session?.user || !(session.user as any).id) return null;

    return session.user as Session["user"] & { id: string; admin: boolean };
}

// ── Exports públicos ──────────────────────────────────────────────────────────

export async function getSession() {
    return getServerSession(authOptions);
}

export async function requireAuth(): Promise<RouteAuthResult> {
    const session = await getSession();
    const user = getRouteUser(session);

    if (!user) return { ok: false, status: 401, reason: "unauthorized" };

    return { ok: true, session: session!, user };
}

export async function requireAdmin(): Promise<RouteAuthResult> {
    const auth = await requireAuth();
    if (!auth.ok) return auth;

    if (!auth.user.admin) {
        return { ok: false, status: 403, reason: "forbidden" };
    }

    return auth;
}

export async function requireOwnerOrAdmin(
    ownerId: string,
): Promise<RouteAuthResult> {
    const auth = await requireAuth();
    if (!auth.ok) return auth;

    if (auth.user.admin || auth.user.id === ownerId) return auth;

    return { ok: false, status: 403, reason: "forbidden" };
}

export async function isAuthenticated(): Promise<boolean> {
    const auth = await requireAuth();
    return auth.ok;
}

export async function isAdminAuthenticated(): Promise<boolean> {
    const auth = await requireAdmin();
    return auth.ok;
}