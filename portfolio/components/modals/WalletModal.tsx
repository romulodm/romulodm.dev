// src/components/support/WalletModal.tsx
'use client'

import { Wallet } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'


export interface EthProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export interface EIP6963Provider {
    info: { uuid: string; name: string; icon: string }
    provider: EthProvider
}

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    wallets: EIP6963Provider[]
    onConnect: (wallet: EIP6963Provider) => void
}

export function WalletModal({ open, onOpenChange, wallets, onConnect }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm bg-background border-border">
                <DialogHeader>
                    <DialogTitle>Conectar carteira</DialogTitle>
                    <DialogDescription>
                        Escolha a carteira que deseja usar para realizar o pagamento.
                    </DialogDescription>
                </DialogHeader>

                {wallets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma carteira detectada. Instale MetaMask, Rainbow ou Coinbase Wallet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {wallets.map((w) => (
                            <button
                                key={w.info.uuid}
                                type="button"
                                onClick={() => onConnect(w)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted transition text-left"
                            >
                                {w.info.icon ? (
                                    <img src={w.info.icon} alt={w.info.name} className="w-7 h-7 rounded-md" />
                                ) : (
                                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                                <span className="text-sm font-medium text-foreground">{w.info.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}