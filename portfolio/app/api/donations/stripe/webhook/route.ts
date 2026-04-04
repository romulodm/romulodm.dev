import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payments/stripe'
import { prisma } from '@romulo/database'

export async function POST(req: NextRequest) {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: ReturnType<typeof stripe.webhooks.constructEvent>
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const paymentIntent = event.data.object as { id: string }

    if (event.type === 'payment_intent.succeeded') {
        await prisma.donation.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: { status: 'COMPLETED' },
        })
    }

    if (event.type === 'payment_intent.payment_failed') {
        await prisma.donation.updateMany({
            where: { stripePaymentIntentId: paymentIntent.id },
            data: { status: 'FAILED' },
        })
    }

    return NextResponse.json({ ok: true })
}