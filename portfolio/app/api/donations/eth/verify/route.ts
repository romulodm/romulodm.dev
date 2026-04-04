import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@romulo/database'

export async function POST(req: NextRequest) {
    const { txHash, coffees, name, message, isPrivate, walletAddress } = await req.json()

    // Verifica a tx na Etherscan
    const ethRes = await fetch(
        `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash` +
        `&txhash=${txHash}&apikey=${process.env.ETHERSCAN_API_KEY}`
    )
    const ethData = await ethRes.json()
    const tx = ethData.result

    if (!tx || tx.to?.toLowerCase() !== process.env.ETH_WALLET_ADDRESS?.toLowerCase()) {
        return NextResponse.json({ error: 'Transaction inválida' }, { status: 400 })
    }

    const amountGwei = parseInt(tx.value, 16)

    await prisma.donation.create({
        data: {
            coffees: coffees || 1,
            amount: amountGwei,
            currency: 'ETH',
            provider: 'ETH',
            name: isPrivate ? null : name || null,
            message: message || null,
            isPrivate: Boolean(isPrivate),
            walletAddress,
            txHash,
            status: 'COMPLETED',
        },
    })

    return NextResponse.json({ ok: true })
}