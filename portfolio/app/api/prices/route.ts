// src/app/api/prices/route.ts
import { NextResponse } from 'next/server'
import { getPrices } from '@romulo/web3'

export async function GET() {
    try {
        const prices = await getPrices()
        return NextResponse.json(prices)
    } catch {
        return NextResponse.json(
            { error: 'Preço indisponível' },
            { status: 503 },
        )
    }
}