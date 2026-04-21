// components/auth/ForgotPasswordForm.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import CircularProgress from "@mui/material/CircularProgress"
import { MdOutlineAlternateEmail } from "react-icons/md"
import { MdCheckCircleOutline } from "react-icons/md"
import { useTranslations } from "next-intl"

import { createForgotPasswordSchema, type ForgotPasswordValues } from "./schemas"
import { Logo } from "@/components/Logo"

interface Props {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: Props) {
  const t = useTranslations("auth")
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const schema = createForgotPasswordSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: ForgotPasswordValues) {
    setServerError(null)

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setServerError(data.message ?? t("forgot.genericError"))
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center w-full text-center">
        <div className="flex flex-col items-center mb-5">
          <div className="text-primary w-8 h-8">
            <Logo />
          </div>
          <p className="text-primary text-xl font-bold mt-1">Acumulou</p>
        </div>

        <MdCheckCircleOutline className="text-green-500 text-5xl mb-3" />

        <p className="text-gray-800 dark:text-white text-sm font-medium mb-1">
          {t("forgot.successTitle")}
        </p>
        <p className="text-gray-400 dark:text-neutral-400 text-xs mb-6 max-w-xs">
          {t("forgot.successDescription")}
        </p>

        <div className="flex text-sm items-center gap-1.5 text-gray-400 dark:text-neutral-400">
          <span>{t("forgot.rememberedPassword")}</span>
          <button
            type="button"
            onClick={onBack}
            className="text-primary font-bold hover:text-primary/80"
          >
            {t("forgot.login")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col items-center w-full"
    >
      {serverError && (
        <p className="w-full mb-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {serverError}
        </p>
      )}

      <div
        className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.email ? "border-red-400" : "border-transparent"
          }`}
      >
        <MdOutlineAlternateEmail
          className={`ml-3 text-lg shrink-0 ${errors.email ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
        />
        <input
          {...register("email")}
          placeholder={t("forgot.emailPlaceholder")}
          type="email"
          autoComplete="email"
          autoFocus
          className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
        />
      </div>
      {errors.email && (
        <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.email.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <CircularProgress size={20} sx={{ color: "white" }} />
        ) : (
          t("forgot.submit")
        )}
      </button>

      <div className="flex mt-4 text-sm items-center gap-1.5 text-gray-400 dark:text-neutral-400">
        <span>{t("forgot.didntForgetPassword")}</span>
        <button
          type="button"
          onClick={onBack}
          className="text-primary font-bold hover:text-primary/80"
        >
          {t("forgot.login")}
        </button>
      </div>
    </form>
  )
}
