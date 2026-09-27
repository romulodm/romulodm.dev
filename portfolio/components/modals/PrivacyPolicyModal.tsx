'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ShieldCheck, QrCode, CreditCard, Lock, ExternalLink } from 'lucide-react'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PrivacyPolicyModal({ open, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-border max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                        Privacidade &amp; Segurança
                    </DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Nenhum dado financeiro toca nossos servidores — tudo é processado por parceiros certificados.
                </p>

                {/* PIX */}
                <section className="border-border border-t px-4 pt-5 space-y-3">
                    <h3 className="type-small font-semibold flex items-center gap-2 text-foreground">
                        <QrCode className="w-4 h-4 text-muted-foregrou shrink-0" />
                        PIX — processado pela AbacatePay
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            QR Code gerado pela AbacatePay, fintech registrada no Banco Central.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Seus dados bancários nunca passam por este site. A transação ocorre diretamente entre seu banco e o BC.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Criptografia de ponta a ponta via protocolo PIX do Banco Central.
                        </li>
                    </ul>
                    <a
                        href="https://www.abacatepay.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:underline font-medium"
                    >
                        Site da AbacatePay <ExternalLink className="w-3 h-3" />
                    </a>
                </section>

                {/* Card */}
                <section className="border-border border-t px-4 pt-5 space-y-3">
                    <h3 className="type-small font-semibold flex items-center gap-2 text-foreground">
                        <CreditCard className="w-4 h-4 text-muted-foregrou shrink-0" />
                        Cartão — processado pela Stripe
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            O formulário é carregado diretamente da Stripe — número do cartão, CVV e validade nunca chegam aos nossos servidores.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Stripe é certificada PCI-DSS nível 1, o padrão mais alto para pagamentos com cartão. Usada por Shopify, Amazon e Google.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Toda comunicação é criptografada via TLS 1.2+. Não armazenamos dados de cartão.
                        </li>
                    </ul>
                    <a
                        href="https://stripe.com/docs/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-medium"
                    >
                        Segurança da Stripe <ExternalLink className="w-3 h-3" />
                    </a>
                </section>

                {/* What we store */}
                <section className="border-border border-t px-4 pt-5 space-y-3">
                    <h3 className="type-small font-semibold flex items-center gap-2 text-foreground">
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        O que armazenamos
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Apenas nome (opcional), mensagem (opcional), valor e data.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Nunca armazenamos dados bancários, número de cartão, CVV ou senhas.
                        </li>
                        <li className="flex gap-2">
                            <span className="text-green-500 shrink-0">✓</span>
                            Com "Mensagem privada" marcada, seu nome e mensagem ficam ocultos publicamente.
                        </li>
                    </ul>
                </section>
            </DialogContent>
        </Dialog>
    )
}