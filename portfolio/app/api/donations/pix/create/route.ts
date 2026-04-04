import { NextRequest, NextResponse } from 'next/server'
import { createPixCharge } from '@/lib/payments/abacate'
import { prisma } from '@romulo/database'

const COFFEE_CENTS = 500 // R$5,00

export async function POST(req: NextRequest) {
    const { coffees, name, message, isPrivate, isMonthly, email, cellphone, taxId } = await req.json()
    const amount = Math.max(1, coffees) * COFFEE_CENTS

    // Cria o registro pendente antes de chamar a API externa
    const donation = await prisma.donation.create({
        data: {
            coffees,
            amount,
            currency: 'BRL',
            provider: 'PIX',
            name: isPrivate ? null : name || null,
            message: message || null,
            isPrivate: Boolean(isPrivate),
            isMonthly: Boolean(isMonthly),
            status: 'PENDING',
        },
    })

    const charge = await createPixCharge({
        amount,
        correlationId: donation.id,
        description: `${coffees}x café para o blog`,
        name: name || undefined,
        email: email || undefined,
        cellphone: cellphone || undefined,
        taxId: taxId || undefined,
    })

    // Salva o ID do QR code para checar status via webhook ou polling
    await prisma.donation.update({
        where: { id: donation.id },
        data: { abacatePayChargeId: charge.id },
    })

    return NextResponse.json({
        pixId: charge.id,
        brCode: charge.brCode,
        brCodeBase64: charge.brCodeBase64, // imagem pronta para <img src={brCodeBase64} />
        donationId: donation.id,
    })
}