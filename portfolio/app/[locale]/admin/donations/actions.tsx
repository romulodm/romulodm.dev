// src/app/admin/donations/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth-helpers'
import { prisma } from '@romulo/database'

export async function editDonationMessage(
    id: string,
    message: string
): Promise<{ error: string } | void> {
    if (!(await isAdminAuthenticated())) redirect('/')

    const cleaned = message.trim().slice(0, 500)
    await prisma.donation.update({
        where: { id },
        data: { message: cleaned || null },
    })

    revalidatePath('/admin/donations')
}

export async function deleteDonation(id: string) {
    if (!(await isAdminAuthenticated())) redirect('/')

    await prisma.donation.delete({ where: { id } })
    revalidatePath('/admin/donations')
}