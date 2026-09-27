/**
 * Testes de regressão — POST /api/donations/eth/verify
 *
 *   1. txHash com formato inválido → 400
 *   2. txHash duplicado (replay) → 400
 *   3. Rate limit excedido → 429
 *   4. Transação para carteira errada → 400
 *   5. Transação válida → 200, coffees limitado a MAX_COFFEES
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks

vi.mock('@romulo/database', () => ({
  prisma: {
    donation: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  getRequestIp: vi.fn(() => '127.0.0.1'),
}))

// revalidatePath/revalidateTag need a Next request store that does not exist
// under vitest.
vi.mock('@/lib/payments/revalidate-donations', () => ({
  revalidateDonationViews: vi.fn(),
}))

vi.mock('@/lib/api-intl', () => ({
  getApiTranslator: vi.fn(() => (key: string) => key),
}))

const VALID_TX_HASH = '0x' + 'a'.repeat(64)
const WALLET = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

process.env.ETH_WALLET_ADDRESS = WALLET
process.env.ETHERSCAN_API_KEY = 'test-key'

// ── Helpers

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/donations/eth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockEtherscan(to: string, value = '0xde0b6b3a7640000') {
  global.fetch = vi.fn().mockResolvedValueOnce({
    json: () => Promise.resolve({ result: { to, value } }),
  } as unknown as Response)
}

/*
 * Imports em escopo de modulo. Dentro do callback sincrono do describe, o
 * `await` faz o esbuild recusar o transform e a suite nunca roda — era o caso
 * deste arquivo. Os vi.mock acima sao hoistados, entao os mocks valem aqui.
 */
const { prisma } = await import('@romulo/database')
const { rateLimit } = await import('@/lib/rate-limit')
const { POST } = await import('../eth/verify/route')

// ── Testes

describe('POST /api/donations/eth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rateLimit).mockResolvedValue(false) // sem rate limit por padrão
    vi.mocked(prisma.donation.findFirst).mockResolvedValue(null) // sem duplicata
    vi.mocked(prisma.donation.create).mockResolvedValue({} as never)
  })

  it('rejeita txHash com formato inválido (sem 0x)', async () => {
    const res = await POST(makeRequest({ txHash: 'abc123', coffees: 1 }))
    expect(res.status).toBe(400)
    expect(await prisma.donation.create).not.toHaveBeenCalled()
  })

  it('rejeita txHash muito curto', async () => {
    const res = await POST(makeRequest({ txHash: '0xabc', coffees: 1 }))
    expect(res.status).toBe(400)
  })

  it('rejeita txHash com caracteres inválidos', async () => {
    const res = await POST(makeRequest({ txHash: '0x' + 'z'.repeat(64), coffees: 1 }))
    expect(res.status).toBe(400)
  })

  it('rejeita txHash duplicado (prevenção de replay)', async () => {
    vi.mocked(prisma.donation.findFirst).mockResolvedValue({ id: 'existing' } as never)

    const res = await POST(makeRequest({ txHash: VALID_TX_HASH, coffees: 1 }))
    expect(res.status).toBe(400)
    expect(await prisma.donation.create).not.toHaveBeenCalled()
  })

  it('retorna 429 quando rate limit é excedido', async () => {
    vi.mocked(rateLimit).mockResolvedValue(true)

    const res = await POST(makeRequest({ txHash: VALID_TX_HASH, coffees: 1 }))
    expect(res.status).toBe(429)
  })

  it('rejeita transação para carteira errada', async () => {
    mockEtherscan('0x0000000000000000000000000000000000000000')

    const res = await POST(makeRequest({ txHash: VALID_TX_HASH, coffees: 1 }))
    expect(res.status).toBe(400)
    expect(await prisma.donation.create).not.toHaveBeenCalled()
  })

  it('aceita transação válida e limita coffees ao máximo permitido', async () => {
    mockEtherscan(WALLET)

    const res = await POST(makeRequest({ txHash: VALID_TX_HASH, coffees: 9999 }))
    expect(res.status).toBe(200)

    const createCall = vi.mocked(prisma.donation.create).mock.calls[0]?.[0]
    expect(createCall?.data.coffees).toBe(100) // MAX_COFFEES = 100
    expect(createCall?.data.txHash).toBe(VALID_TX_HASH)
  })

  it('usa coffees = 1 como padrão quando não fornecido', async () => {
    mockEtherscan(WALLET)

    await POST(makeRequest({ txHash: VALID_TX_HASH }))

    const createCall = vi.mocked(prisma.donation.create).mock.calls[0]?.[0]
    expect(createCall?.data.coffees).toBe(1)
  })

  it('não expõe detalhes de por que a transação foi rejeitada (mesmo erro para duplicata e tx inválida)', async () => {
    // Duplicata
    vi.mocked(prisma.donation.findFirst).mockResolvedValue({ id: 'existing' } as never)
    const resDuplicate = await POST(makeRequest({ txHash: VALID_TX_HASH, coffees: 1 }))

    // TX inválida
    vi.mocked(prisma.donation.findFirst).mockResolvedValue(null)
    mockEtherscan('0x0000000000000000000000000000000000000000')
    const resInvalid = await POST(makeRequest({ txHash: VALID_TX_HASH, coffees: 1 }))

    expect(resDuplicate.status).toBe(resInvalid.status)
    const bodyDuplicate = await resDuplicate.json()
    const bodyInvalid = await resInvalid.json()
    // Mesma chave de erro — não vaza informação sobre o motivo
    expect(bodyDuplicate).toEqual(bodyInvalid)
  })
})
