// components/auth/ResetPasswordForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "react-toastify"
import CircularProgress from "@mui/material/CircularProgress"
import { RiLockPasswordLine } from "react-icons/ri"
import { MdVisibility, MdVisibilityOff, MdCheckCircleOutline } from "react-icons/md"
import { useTranslations } from "next-intl"

import { createResetPasswordSchema, type ResetPasswordValues } from "./schemas"
import { Logo } from "@/components/Logo"

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const t = useTranslations("auth")
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const schema = createResetPasswordSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: ResetPasswordValues) {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.message ?? t("reset.genericError"))
      return
    }

    toast.success(t("reset.successTitle"))
    setDone(true)
  }

  return (
    <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl px-6 py-8">
      <div className="flex flex-col items-center mb-5">
        <div className="text-primary w-8 h-8">
          <Logo />
        </div>
        <p className="text-primary text-xl font-bold mt-1">Acumulou</p>
      </div>

      {done ? (
        <div className="flex flex-col items-center text-center">
          <MdCheckCircleOutline className="text-green-500 text-5xl mb-3" />
          <p className="text-gray-800 dark:text-white text-sm font-medium mb-1">
            {t("reset.successTitle")}
          </p>
          <p className="text-gray-400 dark:text-neutral-400 text-xs mb-6">
            {t("reset.successDescription")}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t("reset.goToLogin")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col items-center">
          <p className="dark:text-white text-gray-800 mb-5 text-sm font-medium text-center">
            {t("reset.description")}
          </p>

          <div
            className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.password ? "border-red-400" : "border-transparent"}`}
          >
            <RiLockPasswordLine
              className={`ml-3 text-lg shrink-0 ${errors.password ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
            />
            <input
              {...register("password")}
              placeholder={t("reset.passwordPlaceholder")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="mr-3 text-gray-400 hover:text-gray-500 dark:text-neutral-500 dark:hover:text-neutral-400"
            >
              {showPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
            </button>
          </div>
          {errors.password && (
            <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.password.message}</p>
          )}

          <div
            className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.confirmPassword ? "border-red-400" : "border-transparent"}`}
          >
            <RiLockPasswordLine
              className={`ml-3 text-lg shrink-0 ${errors.confirmPassword ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
            />
            <input
              {...register("confirmPassword")}
              placeholder={t("reset.confirmPasswordPlaceholder")}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="mr-3 text-gray-400 hover:text-gray-500 dark:text-neutral-500 dark:hover:text-neutral-400"
            >
              {showConfirm ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              t("reset.submit")
            )}
          </button>
        </form>
      )}
    </div>
  )
}