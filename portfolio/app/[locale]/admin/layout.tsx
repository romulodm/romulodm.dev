import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth-helpers'
import { AdminShell } from '@/components/admin/AdminShell'
import { ADMIN_SIDEBAR_COOKIE } from '@/lib/admin-sidebar'
import { prisma } from '@romulo/database'
import { AVATAR_SELECT } from '@/lib/avatar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const authenticated = await isAdminAuthenticated()
    if (!authenticated) redirect('/')

    // Busca dados do usuário para exibir na sidebar
    const user = await prisma.user.findFirst({
        where: { admin: true },
        select: { email: true, ...AVATAR_SELECT },
    })

    const cookieStore = await cookies()
    const initialCollapsed = cookieStore.get(ADMIN_SIDEBAR_COOKIE)?.value === 'collapsed'

    return (
        <AdminShell user={user} initialCollapsed={initialCollapsed}>
            {children}
        </AdminShell>
    )
}
