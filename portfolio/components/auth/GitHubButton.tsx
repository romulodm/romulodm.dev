// components/auth/GitHubButton.tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import CircularProgress from "@mui/material/CircularProgress"
import { FaGithub } from "react-icons/fa"
import { useTranslations } from "next-intl"

interface Props {
    disabled?: boolean
}

export function GitHubButton({ disabled }: Props) {
    const t = useTranslations("auth")
    const [loading, setLoading] = useState(false)

    async function handleClick() {
        setLoading(true)
        try {
            await signIn("github", { callbackUrl: window.location.href })
        } catch {
            toast.error(t("toasts.oauthSignin"))
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            disabled={disabled || loading}
            onClick={handleClick}
            className="w-full text-gray-600 dark:text-neutral-100 flex items-center justify-center gap-x-3 py-2.5 border-2 rounded-lg hover:bg-neutral-200/90 dark:bg-neutral-900 hover:dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {loading ? (
                <CircularProgress size={22} color="inherit" />
            ) : (
                <>
                    <FaGithub className="text-2xl" />
                    <span>{t("github.continue")}</span>
                </>
            )}
        </button>
    )
}