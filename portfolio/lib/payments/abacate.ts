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

export async function createPixCharge(params: CreatePixChargeParams): Promise<PixQrCodeResponse['data']> {
    const res = await fetch(`${BASE}/pixQrCode/create`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            amount: params.amount,
            expiresIn: 3600, // 1 hora para o QR code expirar
            description: params.description?.slice(0, 140),

            // customer é opcional — se não tiver dados do doador, omite o objeto inteiro
            ...(params.email && {
                customer: {
                    name: params.name || 'Apoiador Anônimo',
                    email: params.email,
                    cellphone: params.cellphone || '(00) 00000-0000',
                    taxId: params.taxId || '000.000.000-00',
                },
            }),

            // correlationId salvo em metadata para rastrear qual Donation foi paga
            metadata: { donationId: params.correlationId },
        }),
    })

    const json: PixQrCodeResponse = await res.json()

    if (!res.ok || json.error) {
        throw new Error(`Abacate Pay error: ${json.error ?? res.statusText}`)
    }

    return json.data
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