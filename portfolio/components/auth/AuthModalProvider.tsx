"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { AuthModal, AuthView } from "@/components/auth/AuthModal"

interface AuthModalContextValue {
    openModal: (view?: AuthView) => void
    closeModal: () => void
}

const AuthModalContext = createContext<AuthModalContextValue>({
    openModal: () => { },
    closeModal: () => { },
})

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<AuthView>("login")

    const openModal = useCallback((v: AuthView = "login") => {
        setView(v)
        setOpen(true)
    }, [])

    const closeModal = useCallback(() => setOpen(false), [])

    return (
        <AuthModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <AuthModal open={open} onClose={closeModal} defaultView={view} />
        </AuthModalContext.Provider>
    )
}

export function useAuthModal() {
    return useContext(AuthModalContext)
}