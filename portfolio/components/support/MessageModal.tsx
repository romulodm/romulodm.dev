// src/components/support/MessageModal.tsx
'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Coffee } from 'lucide-react'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    name: string | null
    message: string
}

export function MessageModal({ open, onOpenChange, name, message }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {name || 'Anônimo'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium tracking-wide">
                        deixou a seguinte mensagem:
                    </p>
                    <div className="bg-muted/50 rounded-lg px-4 py-3 max-h-64 max-w-sm overflow-y-auto">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                            {message}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}