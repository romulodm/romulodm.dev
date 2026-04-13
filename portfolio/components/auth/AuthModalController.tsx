"use client"

import { useCallback, useState } from "react"
import { AuthModal } from "@/components/auth/AuthModal"
import { Button } from "@/components/ui/button"

export function AuthModalController() {
    const [open, setOpen] = useState(false)
    const openAuthModal = useCallback(() => setOpen(true), [])
    const closeAuthModal = useCallback(() => setOpen(false), [])

    return (
        <>
            <Button onClick={openAuthModal}>
                Entrar
            </Button>
            <AuthModal open={open} onClose={closeAuthModal} />
        </>
    )
}