import { NextResponse } from 'next/server'
import { prisma } from '@romulo/database'

export async function GET() {
    const top = await prisma.donation.findMany({
        where: { status: 'COMPLETED', isPrivate: false, currency: 'BRL' },
        orderBy: { amount: 'desc' },
        take: 10,
        select: { id: true, name: true, message: true, amount: true, coffees: true, createdAt: true, provider: true },
    })

    const recent = await prisma.donation.findMany({
        where: { status: 'COMPLETED', isPrivate: false },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, message: true, amount: true, coffees: true, createdAt: true, currency: true },
    })

    return NextResponse.json({ top, recent })
}