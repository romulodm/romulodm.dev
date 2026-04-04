import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@romulo/database'

export async function POST(req: NextRequest) {
    // 1. Valida o webhook secret
    //const webhookSecret = req.headers.get('x-webhook-secret')

    const webhookSecret = req.nextUrl.searchParams.get('webhookSecret')

    if (webhookSecret !== process.env.ABACATE_PAY_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (body.event === 'billing.paid') {
        const donationId = body.data?.pixQrCode?.metadata?.donationId
        const chargeId = body.data?.pixQrCode?.id

        if (!donationId) {
            return NextResponse.json({ error: 'Missing donationId' }, { status: 400 })
        }

        await prisma.donation.updateMany({
            where: { id: donationId },
            data: {
                status: 'COMPLETED',
                abacatePayChargeId: chargeId ?? undefined,
            },
        })
    }

    return NextResponse.json({ ok: true })
}