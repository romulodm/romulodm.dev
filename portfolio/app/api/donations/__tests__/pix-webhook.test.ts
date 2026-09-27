/**
 * Testes de regressão — POST /api/donations/pix/webhook
 *
 *   1. Sem header x-webhook-secret → 401
 *   2. Header x-webhook-secret incorreto → 401
 *   3. Secret via query param (padrão antigo) → NÃO aceita → 401
 *   4. Header correto + billing.paid → promove doação → 200
 *   5. Header correto + donationId ausente → 400
 *   6. Header correto + evento desconhecido → ignora, retorna 200
 *   7. Reentrega do mesmo evento não reprocessa (idempotência)
 *   8. Divergência de liquidação responde 200 mas registra falha, em vez de
 *      responder "ok" silenciosamente
 *   9. billing.expired marca a doação como EXPIRED
 *  10. Só uma promoção real invalida o cache da página /support
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────

const markDonationCompleted = vi.fn()
const markDonationExpired = vi.fn()
const recordWebhookEvent = vi.fn()
const finalizeWebhookEvent = vi.fn()
const logApiError = vi.fn()
const revalidateDonationViews = vi.fn()

vi.mock('@romulo/database', () => ({
  markDonationCompleted: (...args: unknown[]) => markDonationCompleted(...args),
  markDonationExpired: (...args: unknown[]) => markDonationExpired(...args),
  // Reimplementados aqui para o teste não depender do pacote compilado.
  needsAttention: (o: { kind: string }) =>
    o.kind === 'not_found' || o.kind === 'amount_mismatch' || o.kind === 'terminal_state',
  describeOutcome: (o: { kind: string }) => `outcome:${o.kind}`,
}))

vi.mock('@/lib/payments/webhook-events', () => ({
  recordWebhookEvent: (...args: unknown[]) => recordWebhookEvent(...args),
  finalizeWebhookEvent: (...args: unknown[]) => finalizeWebhookEvent(...args),
  buildAbacateEventId: (type: string, charge?: string) => `${type}:${charge ?? 'unknown'}`,
}))

// revalidatePath/revalidateTag need a Next request store that does not exist
// under vitest; the helper is replaced so the tests can assert when it runs.
vi.mock('@/lib/payments/revalidate-donations', () => ({
  revalidateDonationViews: (...args: unknown[]) => revalidateDonationViews(...args),
}))

vi.mock('@/lib/api-intl', () => ({
  getApiTranslator: vi.fn(() => (key: string) => key),
}))

vi.mock('@/lib/api-errors', async () => {
  const { NextResponse } = await import('next/server')
  return {
    badRequestResponse: (m: string) => NextResponse.json({ error: m }, { status: 400 }),
    unauthorizedResponse: (m: string) => NextResponse.json({ error: m }, { status: 401 }),
    internalErrorResponse: (_c: string, _e: unknown, m: string) =>
      NextResponse.json({ error: m }, { status: 500 }),
    logApiError: (...args: unknown[]) => logApiError(...args),
  }
})

const WEBHOOK_SECRET = 'super-secret-pix-key'
process.env.ABACATE_PAY_WEBHOOK_SECRET = WEBHOOK_SECRET

// ── Helpers

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

const billingPaidEvent = (donationId: string, amount?: number) => ({
  event: 'billing.paid',
  data: {
    pixQrCode: {
      id: 'charge-abc',
      ...(amount !== undefined ? { amount } : {}),
      metadata: { donationId },
    },
  },
})

const authHeader = { 'x-webhook-secret': WEBHOOK_SECRET }

const { POST } = await import('../pix/webhook/route')

// ── Testes

describe('POST /api/donations/pix/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    recordWebhookEvent.mockResolvedValue({ id: 'evt-row-1', duplicate: false })
    finalizeWebhookEvent.mockResolvedValue(undefined)
    markDonationCompleted.mockResolvedValue({
      kind: 'completed', donationId: 'donation-42', amount: 500,
    })
    markDonationExpired.mockResolvedValue('expired')
  })

  // ── Autenticação

  it('recusa requisição sem header x-webhook-secret → 401', async () => {
    const res = await POST(makeRequest(billingPaidEvent('donation-1')))
    expect(res.status).toBe(401)
    expect(markDonationCompleted).not.toHaveBeenCalled()
  })

  it('recusa requisição com header x-webhook-secret incorreto → 401', async () => {
    const res = await POST(
      makeRequest(billingPaidEvent('donation-1'), { 'x-webhook-secret': 'wrong-secret-same-len' }),
    )
    expect(res.status).toBe(401)
    expect(markDonationCompleted).not.toHaveBeenCalled()
  })

  it('recusa secret via query param (padrão antigo inseguro) → 401', async () => {
    const res = await POST(
      makeRequest(billingPaidEvent('donation-1'), {}, { webhookSecret: WEBHOOK_SECRET }),
    )
    expect(res.status).toBe(401)
    expect(markDonationCompleted).not.toHaveBeenCalled()
  })

  // ── Caminho felizes

  it('aceita header correto + billing.paid → promove doação → 200', async () => {
    const res = await POST(makeRequest(billingPaidEvent('donation-42', 500), authHeader))

    expect(res.status).toBe(200)
    expect(markDonationCompleted).toHaveBeenCalledWith({
      ref: { by: 'id', id: 'donation-42' },
      paidAmount: 500,
      abacatePayChargeId: 'charge-abc',
    })
    expect(finalizeWebhookEvent).toHaveBeenCalledWith('evt-row-1', 'PROCESSED', {
      donationId: 'donation-42',
    })
    expect(revalidateDonationViews).toHaveBeenCalledTimes(1)
  })

  it('doação que já estava confirmada não invalida o cache de novo', async () => {
    markDonationCompleted.mockResolvedValue({ kind: 'already_completed', donationId: 'donation-42' })

    const res = await POST(makeRequest(billingPaidEvent('donation-42', 500), authHeader))

    expect(res.status).toBe(200)
    expect(revalidateDonationViews).not.toHaveBeenCalled()
  })

  it('retorna 400 quando billing.paid não tem donationId', async () => {
    const event = { event: 'billing.paid', data: { pixQrCode: { id: 'charge-xyz', metadata: {} } } }
    const res = await POST(makeRequest(event, authHeader))

    expect(res.status).toBe(400)
    expect(markDonationCompleted).not.toHaveBeenCalled()
    expect(finalizeWebhookEvent).toHaveBeenCalledWith('evt-row-1', 'FAILED', expect.anything())
  })

  it('ignora eventos desconhecidos e retorna 200', async () => {
    const res = await POST(makeRequest({ event: 'billing.created' }, authHeader))

    expect(res.status).toBe(200)
    expect(markDonationCompleted).not.toHaveBeenCalled()
    expect(finalizeWebhookEvent).toHaveBeenCalledWith('evt-row-1', 'IGNORED', expect.anything())
  })

  // ── Hardening

  it('reentrega do mesmo evento não reprocessa a doação', async () => {
    recordWebhookEvent.mockResolvedValue({ id: 'evt-row-1', duplicate: true })

    const res = await POST(makeRequest(billingPaidEvent('donation-42', 500), authHeader))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ duplicate: true })
    // O ponto do teste: nenhuma tentativa de mexer no estado da doação.
    expect(markDonationCompleted).not.toHaveBeenCalled()
  })

  it('pagamento sem doação correspondente registra falha em vez de responder ok em silêncio', async () => {
    markDonationCompleted.mockResolvedValue({ kind: 'not_found', reference: 'donation:ghost' })

    const res = await POST(makeRequest(billingPaidEvent('donation-ghost'), authHeader))

    // 200 porque reentregar não corrige divergência de dados...
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ warning: 'not_found' })
    // ...mas o evento não pode passar como processado.
    expect(logApiError).toHaveBeenCalled()
    expect(finalizeWebhookEvent).toHaveBeenCalledWith(
      'evt-row-1', 'FAILED', expect.objectContaining({ donationId: 'donation-ghost' }),
    )
  })

  it('valor divergente não promove a doação', async () => {
    markDonationCompleted.mockResolvedValue({
      kind: 'amount_mismatch', donationId: 'donation-42', expected: 500, received: 100,
    })

    const res = await POST(makeRequest(billingPaidEvent('donation-42', 100), authHeader))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ warning: 'amount_mismatch' })
    expect(logApiError).toHaveBeenCalled()
    expect(revalidateDonationViews).not.toHaveBeenCalled()
  })

  it('billing.expired marca a doação como EXPIRED', async () => {
    const event = {
      event: 'billing.expired',
      data: { pixQrCode: { id: 'charge-abc', metadata: { donationId: 'donation-42' } } },
    }
    const res = await POST(makeRequest(event, authHeader))

    expect(res.status).toBe(200)
    expect(markDonationExpired).toHaveBeenCalledWith({ by: 'id', id: 'donation-42' })
    expect(markDonationCompleted).not.toHaveBeenCalled()
  })
})
