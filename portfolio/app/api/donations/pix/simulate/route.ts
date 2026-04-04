import { NextRequest, NextResponse } from 'next/server'
import { simulatePixPayment } from '@/lib/payments/abacate'
import { prisma } from '@romulo/database'

// Rota só disponível fora de produção
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Não disponível em produção' }, { status: 403 })
    }

    const { pixId, donationId } = await req.json()

    await simulatePixPayment(pixId)

    await prisma.donation.updateMany({
        where: { id: donationId, status: 'PENDING' },
        data: { status: 'COMPLETED' },
    })

    return NextResponse.json({ ok: true })
}