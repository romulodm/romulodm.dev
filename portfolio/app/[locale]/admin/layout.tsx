import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth-helpers'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
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

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar user={user} />
            {/* Conteúdo empurrado pela largura da sidebar */}
            <div className="flex-1 ml-64 min-h-screen">
                {children}
            </div>
        </div>
    )
}