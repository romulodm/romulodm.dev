// lib/auth-helpers.ts
// Separado de lib/auth.ts para não criar dependências circulares.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Retorna true se o usuário logado for admin.
 * Use nas API routes que precisavam de `isAuthenticated`.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
    const session = await getServerSession(authOptions);
    return session?.user?.admin === true;
}
