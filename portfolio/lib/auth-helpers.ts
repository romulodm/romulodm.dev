import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";

export async function getSession() {
    return getServerSession(authOptions);
}

export async function isAdminAuthenticated(): Promise<boolean> {
    const auth = await requireAdmin();
    return auth.ok;
}
