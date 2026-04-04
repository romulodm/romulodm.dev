import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payments/stripe'
import { prisma } from '@romulo/database'

const COFFEE_CENTS = 500 // R$5

export async function POST(req: NextRequest) {
    const { coffees, name, message, isPrivate, isMonthly } = await req.json()
    const amount = Math.max(1, coffees) * COFFEE_CENTS

    const intent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        automatic_payment_methods: { enabled: true },
        metadata: { coffees: String(coffees), name: name ?? '', message: message ?? '' },
    })

    await prisma.donation.create({
        data: {
            coffees,
            amount,
            currency: 'BRL',
            provider: 'STRIPE',
            name: isPrivate ? null : name || null,
            message: message || null,
            isPrivate: Boolean(isPrivate),
            isMonthly: Boolean(isMonthly),
            stripePaymentIntentId: intent.id,
            status: 'PENDING',
        },
    })

    return NextResponse.json({ clientSecret: intent.client_secret })
}