// src/app/api/donations/onchain/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { arbitrum, polygon, base } from 'viem/chains'
import { createPublicClient, http, type Chain } from 'viem'

import { prisma } from '@romulo/database'
import {
    getPrices, amountToBrl, amountToUsd,
    decryptMessage,
    NETWORKS, TOKENS, getRpcUrl,
    type NetworkKey, type TokenKey,
} from '@romulo/web3'
import { getRequestIp, rateLimit } from '@/lib/rate-limit'
import {
    badRequestResponse,
    internalErrorResponse,
    rateLimitResponse,
} from '@/lib/api-errors'

const CHAINS: Record<NetworkKey, Chain> = { arbitrum, polygon, base }

const TX_RE = /^0x[0-9a-fA-F]{64}$/
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/
const MAX_WAIT = 90_000

async function waitForReceipt(
    client: ReturnType<typeof createPublicClient>,
    txHash: `0x${string}`,
    deadline: number,
) {
    while (Date.now() < deadline) {
        const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null)
        if (receipt) return receipt
        await new Promise(r => setTimeout(r, 3000))
    }
    return null
}

export async function POST(req: NextRequest) {
    const ip = getRequestIp(req)
    const limited = await rateLimit(`onchain-register:${ip}`, 10, 600)
    if (limited) return rateLimitResponse('Muitas tentativas.')

    try {
        const body = await req.json()
        const {
            txHash, network, token, coffees,
            name, message, encryptedMessage, isPrivate, walletAddress,
        } = body

        if (!TX_RE.test(txHash)) return badRequestResponse('txHash inválido.')
        if (!NETWORKS[network as NetworkKey]) return badRequestResponse('Rede inválida.')
        if (!['ETH', 'USDC', 'USDT'].includes(token)) return badRequestResponse('Token inválido.')
        if (!ADDR_RE.test(walletAddress)) return badRequestResponse('Endereço inválido.')

        const networkKey = network as NetworkKey
        const tokenKey = token as TokenKey
        const myWallet = process.env.WALLET_ADDRESS!.toLowerCase()

        // Idempotência
        const exists = await prisma.onChainDonation.findUnique({ where: { txHash } })
        if (exists) return NextResponse.json({ ok: true })

        const client = createPublicClient({
            chain: CHAINS[networkKey],   // ← sem as any
            transport: http(getRpcUrl(networkKey)),
        })

        const receipt = await waitForReceipt(client, txHash as `0x${string}`, Date.now() + MAX_WAIT)
        if (!receipt || receipt.status !== 'success') {
            return badRequestResponse('Transação não confirmada ou falhou.')
        }

        const tx = await client.getTransaction({ hash: txHash as `0x${string}` })

        let rawAmount!: bigint
        let verified = false

        if (tokenKey === 'ETH') {
            if (tx.to?.toLowerCase() === myWallet) {
                rawAmount = tx.value
                verified = true
            }
        } else {
            const tokenAddress = TOKENS[tokenKey].addresses[networkKey]?.toLowerCase()
            if (tx.to?.toLowerCase() === tokenAddress && tx.input.startsWith('0xa9059cbb')) {
                const recipient = '0x' + tx.input.slice(34, 74)
                const amount = BigInt('0x' + tx.input.slice(74))
                if (recipient.toLowerCase() === myWallet) {
                    rawAmount = amount
                    verified = true
                }
            }
        }

        if (!verified) return badRequestResponse('Transação não corresponde ao destino esperado.')

        const prices = await getPrices()
        const amountBrl = amountToBrl(rawAmount, tokenKey, prices)
        const amountUsd = amountToUsd(rawAmount, tokenKey, prices)

        let storedMessage: string | null = null
        if (isPrivate && encryptedMessage) {
            storedMessage = decryptMessage(encryptedMessage, process.env.ENCRYPTION_PRIVATE_KEY!)
        }

        const block = await client.getBlock({
            blockNumber: receipt.blockNumber,
            includeTransactions: false,
        })
        const donatedAt = new Date(Number(block.timestamp) * 1000)

        await prisma.onChainDonation.create({
            data: {
                txHash,
                network: networkKey,
                token: tokenKey,
                rawAmount: rawAmount.toString(),
                amountUsd,
                amountBrl,
                coffees: Math.max(1, Math.min(100, Number(coffees) || 1)),
                donor: walletAddress,
                name: isPrivate ? null : name || null,
                message: isPrivate ? storedMessage : message || null,
                encryptedMessage: isPrivate ? encryptedMessage : null,
                isPrivate: Boolean(isPrivate),
                blockNumber: receipt.blockNumber.toString(),
                // logIndex removido — sem contrato, sem evento
                donatedAt,
            },
        })

        return NextResponse.json({ ok: true })

    } catch (err) {
        return internalErrorResponse('onchain-register', err, 'Erro interno.')
    }
}