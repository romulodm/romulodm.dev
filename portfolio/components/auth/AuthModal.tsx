"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { ForgotPasswordForm } from "./ForgotPasswordForm"
import { Logo } from "../Logo"

export type AuthView = "login" | "register" | "forgot-password"

interface Props {
  open: boolean
  onClose: () => void
  defaultView?: AuthView
}

export function AuthModal({ open, onClose, defaultView = "login" }: Props) {
  const t = useTranslations("auth")
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
          <>
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center mb-3">
                <div className="text-primary">
                  <Logo size={40} />
                </div>
              </div>

              <p className="dark:text-white/90 text-gray-800 text-sm text-center">
                {t("modal.loginDescription")}
              </p>
            </div>

            <LoginForm
              onSuccess={onClose}
              onForgotPassword={() => setView("forgot-password")}
              onRegister={() => setView("register")}
            />
          </>
        )}
        {view === "register" && (
          <>
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center mb-3">
                <div className="text-primary">
                  <Logo size={40} />
                </div>
              </div>

              <p className="dark:text-white/90 text-gray-800 text-sm text-center">
                {t("modal.registerDescription")}
              </p>
            </div>

            <RegisterForm
              onSuccess={onClose}
              onLogin={() => setView("login")}
            />
          </>
        )}
        {view === "forgot-password" && (
          <>
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col items-center mb-3">
                <div className="text-primary">
                  <Logo size={40} />
                </div>
              </div>

              <p className="dark:text-white/90 text-gray-800 text-sm text-center">
                {t("modal.forgotDescription")}
              </p>
            </div>
            <ForgotPasswordForm onBack={() => setView("login")} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
