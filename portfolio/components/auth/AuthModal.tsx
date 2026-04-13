"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

export type AuthView = "login" | "register" | "forgot-password"

interface Props {
  open: boolean
  onClose: () => void
  defaultView?: AuthView
}

export function AuthModal({ open, onClose, defaultView = "login" }: Props) {
  const [view, setView] = useState<AuthView>(defaultView)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    if (open) setView(defaultView)
  }, [open, defaultView])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={`
                    w-full max-w-sm p-6 shadow-2xl
                    sm:rounded-2xl
                    max-sm:h-full max-sm:max-h-full max-sm:rounded-none
                    max-sm:flex max-sm:flex-col max-sm:justify-center
                    ${isDark
            ? "dark bg-background border-zinc-900 text-zinc-100"
            : "bg-white border-none text-zinc-900"
          }
                `}
      >
        {view === "login" && (
          <LoginForm
            onSuccess={onClose}
            onForgotPassword={() => setView("forgot-password")}
            onRegister={() => setView("register")}
          />
        )}
        {view === "register" && (
          <RegisterForm
            onSuccess={onClose}
            onLogin={() => setView("login")}
          />
        )}
        {view === "forgot-password" && (
          <ForgotPasswordForm onBack={() => setView("login")} />
        )}
      </DialogContent>
    </Dialog>
  )
}