const BASE = 'https://api.abacatepay.com/v1'

const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ABACATE_PAY_API_KEY}`,
}

interface CreatePixChargeParams {
    amount: number        // centavos — mínimo 100 (R$1,00)
    correlationId: string // id da Donation no banco, salvo em metadata
    description?: string  // máximo 140 caracteres
    name?: string
    email?: string
    cellphone?: string
    taxId?: string
}

interface PixQrCodeResponse {
    data: {
        id: string          // pix_char_xxx — usado para checar status
        brCode: string      // string copia-e-cola do PIX
        brCodeBase64: string // "data:image/png;base64,..." para exibir a imagem
        status: string
        expiresAt: string
    }
    error: string | null
}

/**
 * One retry, one second apart. The provider occasionally answers
 * "Erro ao obter código PIX" for a payload that succeeds unchanged on the next
 * try; a single quick retry hides the short version of that blip from the
 * visitor. A longer outage still fails after the second attempt, and the widget
 * shows its generic error so the visitor can try again later. More attempts
 * would only keep the visitor staring at a spinner.
 */
const CREATE_RETRY_DELAY_MS = 1000
const CREATE_MAX_ATTEMPTS = 2

/**
 * A 4xx means the request itself is wrong (bad amount, bad key) and will fail
 * the same way again, so it is not retried. 429 is the exception: it is the
 * provider asking for a pause, not a verdict on the payload.
 */
function isRetryableStatus(status: number): boolean {
    return status >= 500 || status === 429
}

type AttemptResult =
    | { ok: true; data: PixQrCodeResponse['data'] }
    | { ok: false; retryable: boolean; error: Error }

async function attemptCreatePixCharge(body: string): Promise<AttemptResult> {
    let res: Response
    try {
        res = await fetch(`${BASE}/pixQrCode/create`, {
            method: 'POST',
            headers: authHeaders,
            body,
        })
    } catch (error) {
        // No HTTP response at all (DNS, reset, timeout): nothing reached the provider
        // in a way that can be judged, so another attempt is reasonable.
        return {
            ok: false,
            retryable: true,
            error: new Error(`Abacate Pay unreachable: ${error instanceof Error ? error.message : String(error)}`),
        }
    }

    // A gateway error page is HTML, and res.json() would throw a SyntaxError that
    // hides the real status. Parse defensively and let the status decide.
    const json = (await res.json().catch(() => null)) as PixQrCodeResponse | null

    if (res.ok && json && !json.error && json.data) {
        return { ok: true, data: json.data }
    }

    return {
        ok: false,
        // A 2xx carrying `error` is how the provider reports its own internal
        // failures, so it is treated like a 5xx.
        retryable: res.ok || isRetryableStatus(res.status),
        error: new Error(`Abacate Pay error: ${json?.error ?? (res.statusText || res.status)}`),
    }
}

export async function createPixCharge(params: CreatePixChargeParams): Promise<PixQrCodeResponse['data']> {
    const body = JSON.stringify({
        amount: params.amount,
        expiresIn: 3600, // QR code expires after one hour
        description: params.description?.slice(0, 140),

        // customer is optional: without donor data the whole object is omitted
        ...(params.email && {
            customer: {
                name: params.name || 'Apoiador Anônimo',
                email: params.email,
                cellphone: params.cellphone || '(00) 00000-0000',
                taxId: params.taxId || '000.000.000-00',
            },
        }),

        // The Donation id travels in metadata so the webhook can find the row it pays.
        metadata: { donationId: params.correlationId },
    })

    // Retrying is safe here because the caller has not handed anything to the
    // visitor yet. The worst case is an attempt that did create a charge upstream
    // but whose response was lost: that QR code is never shown to anyone, so it
    // cannot be paid, and it expires on its own after `expiresIn`.
    let last: AttemptResult | undefined
    for (let attempt = 1; attempt <= CREATE_MAX_ATTEMPTS; attempt++) {
        last = await attemptCreatePixCharge(body)
        if (last.ok) {
            return { ...last.data, brCodeBase64: toImageSrc(last.data.brCodeBase64) }
        }
        if (!last.retryable || attempt === CREATE_MAX_ATTEMPTS) break
        await new Promise((resolve) => setTimeout(resolve, CREATE_RETRY_DELAY_MS))
    }

    throw (last as Extract<AttemptResult, { ok: false }>).error
}

/**
 * The PixView renders brCodeBase64 straight into <img src>. The docs describe it
 * as a full data URI ("data:image/png;base64,..."), but the value is not always
 * shaped that way, and a bare base64 string in `src` renders as a broken image
 * with nothing in the console to explain it. Accept either shape and always
 * hand the client something the browser can draw.
 */
function toImageSrc(value: string | null | undefined): string {
    const raw = (value ?? '').trim()
    if (!raw) return ''
    if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) return raw
    return `data:image/png;base64,${raw}`
}

// Checa se o QR code já foi pago — útil para polling no frontend
export async function checkPixStatus(pixId: string) {
    const res = await fetch(`${BASE}/pixQrCode/check?id=${pixId}`, {
        headers: authHeaders,
    })

    const json = await res.json()
    if (!res.ok || json.error) throw new Error(`Abacate Pay check error: ${json.error}`)

    return json.data as { status: 'PENDING' | 'PAID' | 'EXPIRED'; expiresAt: string }
}

export async function simulatePixPayment(pixId: string) {
    const res = await fetch(`${BASE}/pixQrCode/simulate-payment?id=${pixId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ metadata: {} }),
    })

    const json = await res.json()
    if (!res.ok || json.error) throw new Error(`Simulate error: ${json.error}`)
    return json.data as { status: 'PAID' }
}