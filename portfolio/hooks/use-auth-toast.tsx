"use client"

import { useEffect } from "react"
import { toast } from "react-toastify"
import { useTranslations } from "next-intl"

export function useAuthToasts() {
        const t = useTranslations("auth.toasts")

        useEffect(() => {
                const params = new URLSearchParams(window.location.search)
                const error = params.get("error")
                const success = params.get("authSuccess")

                if (!error && !success) return

                params.delete("error")
                params.delete("authSuccess")
                const query = params.toString()
                window.history.replaceState(
                        {},
                        "",
                        `${window.location.pathname}${query ? `?${query}` : ""}`
                )

                if (success === "1") {
                        toast.success(t("loginSuccess"))
                        return
                }

                if (!error) return

                switch (error) {
                        case "AccountNotLinked":
                        case "OAuthAccountNotLinked":
                                toast.error(
                                        <div>
                                                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                                                        {t("accountNotLinked")}
                                                </p>
                                                < p style={{ fontSize: 13, opacity: 0.9 }
                                                }>
                                                        {t("accountNotLinkedDescription")}
                                                </p>
                                        </div>,
                                        { autoClose: 6000 }
                                )
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
        }, [])
}