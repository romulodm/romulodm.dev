"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export function useAuthToasts() {
    const t = useTranslations("auth.toasts")

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const error = params.get("error")
        const success = params.get("authSuccess")

        if (!error && !success) return

        // Clean the URL immediately
        params.delete("error")
        params.delete("authSuccess")
        const query = params.toString()
        window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${query ? `?${query}` : ""}`
        )

        try {
            if (success === "1") {
                toast.success(t("loginSuccess"))
                return
            }

            if (!error) return

            switch (error) {
                case "AccountNotLinked":
                case "OAuthAccountNotLinked":
                    toast.error(t("accountNotLinked"), {
                        description: t("accountNotLinkedDescription"),
                        duration: 6000,
                    })
                    break
                case "RateLimited":
                    toast.error(t("rateLimited"))
                    break
                case "AccountBanned":
                    toast.error(t("accountBanned"))
                    break
                case "AccessDenied":
                    toast.error(t("accessDenied"))
                    break
                case "OAuthCallbackError":
                    toast.error(t("oauthCallback"))
                    break
                case "OAuthSignin":
                    toast.error(t("oauthSignin"))
                    break
                case "Verification":
                    toast.error(t("verification"))
                    break
                case "SessionRequired":
                    toast.error(t("sessionRequired"))
                    break
                default:
                    toast.error(t("generic"))
                    break
            }
        } catch {
            // Translation keys missing — show hardcoded fallbacks
            if (success === "1") {
                toast.success("Login realizado com sucesso!")
                return
            }
            switch (error) {
                case "AccountNotLinked":
                case "OAuthAccountNotLinked":
                    toast.error("E-mail já cadastrado com outro método.", {
                        description: "Use o mesmo método com o qual você criou sua conta (Google, GitHub ou e-mail e senha).",
                        duration: 6000,
                    })
                    break
                case "RateLimited":
                    toast.error("Muitas tentativas. Aguarde alguns minutos.")
                    break
                case "AccountBanned":
                    toast.error("Esta conta foi suspensa.")
                    break
                default:
                    toast.error("Ocorreu um erro. Tente novamente.")
                    break
            }
        }
    }, [])
}