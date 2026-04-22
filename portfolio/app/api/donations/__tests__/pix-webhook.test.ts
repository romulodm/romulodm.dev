/**
 * Testes de regressão — POST /api/donations/pix/webhook
 *
 * Cobre os casos de segurança introduzidos na correção:
 *   1. Sem header x-webhook-secret → 401
 *   2. Header x-webhook-secret incorreto → 401
 *   3. Header correto + evento billing.paid → atualiza doação → 200
 *   4. Header correto + evento desconhecido → ignora, retorna 200
 *   5. Header correto + donationId ausente → 400
 *   6. Secret via query param (padrão antigo) → NÃO aceita → 401
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@romulo/database', () => ({
  prisma: {
    donation: {
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/api-intl', () => ({
  getApiTranslator: vi.fn(() => (key: string) => key),
}))

const WEBHOOK_SECRET = 'super-secret-pix-key'
process.env.ABACATE_PAY_WEBHOOK_SECRET = WEBHOOK_SECRET

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
  queryParams: Record<string, string> = {},
) {
  const url = new URL('http://localhost/api/donations/pix/webhook')
  for (const [k, v] of Object.entries(queryParams)) url.searchParams.set(k, v)

  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const billingPaidEvent = (donationId: string) => ({
  event: 'billing.paid',
  data: {
    pixQrCode: {
      id: 'charge-abc',
      metadata: { donationId },
    },
  },
})

// ── Testes ────────────────────────────────────────────────────────────────────

describe('POST /api/donations/pix/webhook', () => {
  const { prisma } = await import('@romulo/database')
  const { POST } = await import('../pix/webhook/route')

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.donation.updateMany).mockResolvedValue({ count: 1 } as never)
  })

  it('recusa requisição sem header x-webhook-secret → 401', async () => {
    const res = await POST(makeRequest(billingPaidEvent('donation-1')))
    expect(res.status).toBe(401)
    expect(prisma.donation.updateMany).not.toHaveBeenCalled()
  })

  it('recusa requisição com header x-webhook-secret incorreto → 401', async () => {
    const res = await POST(
      makeRequest(billingPaidEvent('donation-1'), { 'x-webhook-secret': 'wrong-secret' }),
    )
    expect(res.status).toBe(401)
    expect(prisma.donation.updateMany).not.toHaveBeenCalled()
  })

  it('recusa secret via query param (padrão antigo inseguro) → 401', async () => {
    // Garante que a mudança de query param → header seja irreversível
    const res = await POST(
      makeRequest(billingPaidEvent('donation-1'), {}, { webhookSecret: WEBHOOK_SECRET }),
    )
    expect(res.status).toBe(401)
    expect(prisma.donation.updateMany).not.toHaveBeenCalled()
  })

  it('aceita header correto + billing.paid → atualiza doação → 200', async () => {
    const res = await POST(
      makeRequest(billingPaidEvent('donation-42'), { 'x-webhook-secret': WEBHOOK_SECRET }),
    )
    expect(res.status).toBe(200)
    expect(prisma.donation.updateMany).toHaveBeenCalledWith({
      where: { id: 'donation-42' },
      data: { status: 'COMPLETED', abacatePayChargeId: 'charge-abc' },
    })
  })

  it('retorna 400 quando billing.paid não tem donationId', async () => {
    const event = { event: 'billing.paid', data: { pixQrCode: { id: 'charge-xyz', metadata: {} } } }
    const res = await POST(
      makeRequest(event, { 'x-webhook-secret': WEBHOOK_SECRET }),
    )
    expect(res.status).toBe(400)
    expect(prisma.donation.updateMany).not.toHaveBeenCalled()
  })

  it('ignora eventos desconhecidos e retorna 200', async () => {
    const res = await POST(
      makeRequest({ event: 'billing.created' }, { 'x-webhook-secret': WEBHOOK_SECRET }),
    )
    expect(res.status).toBe(200)
    expect(prisma.donation.updateMany).not.toHaveBeenCalled()
  })
})
