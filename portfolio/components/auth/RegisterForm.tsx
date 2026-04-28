// components/auth/RegisterForm.tsx
"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import CircularProgress from "@mui/material/CircularProgress"
import { MdOutlineAlternateEmail, MdVisibility, MdVisibilityOff } from "react-icons/md"
import { RiLockPasswordLine } from "react-icons/ri"
import { useTranslations } from "next-intl"

import { createRegisterSchema, type RegisterValues } from "./schemas"
import { GoogleButton } from "./GoogleButton"
import { GitHubButton } from "./GitHubButton"

interface Props {
  onSuccess: () => void
  onLogin: () => void
}

function getPasswordScore(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  return score
}

function strengthColor(score: number, index: number): string {
  if (index >= score) return "bg-gray-200 dark:bg-neutral-700"
  if (score <= 2) return "bg-red-500"
  if (score <= 4) return "bg-yellow-400"
  return "bg-green-500"
}

export function RegisterForm({ onSuccess, onLogin }: Props) {
  const t = useTranslations("auth")
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordScore, setPasswordScore] = useState(0)
  const schema = createRegisterSchema(t)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(schema) })

  const passwordValue = watch("password", "")

  useEffect(() => {
    setPasswordScore(getPasswordScore(passwordValue ?? ""))
  }, [passwordValue])

  async function onSubmit(values: RegisterValues) {
    setServerError(null)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: values.username, email: values.email, password: values.password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setServerError(data.message ?? t("register.genericError"))
      return
    }

    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    onSuccess()
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

      <div className="w-full flex flex-col gap-2">
        <GoogleButton disabled={isSubmitting} />
        <GitHubButton disabled={isSubmitting} />
      </div>

      <div className="flex w-full items-center gap-2 my-4 text-xs text-gray-300 dark:text-neutral-600">
        <hr className="flex-1 border-gray-200 dark:border-neutral-700" />
        {t("common.or")}
        <hr className="flex-1 border-gray-200 dark:border-neutral-700" />
      </div>

      <div
        className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.username ? "border-red-400" : "border-transparent"
          }`}
      >
        <span className="ml-3 text-gray-400 dark:text-neutral-400 text-sm font-medium shrink-0">Aa</span>
        <input
          {...register("username")}
          placeholder={t("register.usernamePlaceholder")}
          type="text"
          autoComplete="name"
          className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
        />
      </div>
      {errors.username && (
        <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.username.message}</p>
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
          placeholder={t("register.emailPlaceholder")}
          type="email"
          autoComplete="email"
          className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
        />
      </div>
      {errors.email && (
        <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.email.message}</p>
      )}

      <div
        className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center border ${errors.password ? "border-red-400" : "border-transparent"
          }`}
      >
        <RiLockPasswordLine
          className={`ml-3 text-lg shrink-0 ${errors.password ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
        />
        <input
          {...register("password")}
          placeholder={t("register.passwordPlaceholder")}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
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

      <div className="flex w-full gap-1.5 py-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-sm transition-colors duration-300 ${strengthColor(passwordScore, i)}`} />
          </div>
        ))}
      </div>

      {errors.password && (
        <p className="w-full mb-2 text-xs text-red-500">{errors.password.message}</p>
      )}

      <div
        className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.confirmPassword ? "border-red-400" : "border-transparent"
          }`}
      >
        <RiLockPasswordLine
          className={`ml-3 text-lg shrink-0 ${errors.confirmPassword ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
        />
        <input
          {...register("confirmPassword")}
          placeholder={t("register.confirmPasswordPlaceholder")}
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="mr-3 text-gray-400 hover:text-gray-500 dark:text-neutral-500 dark:hover:text-neutral-400"
        >
          {showConfirmPassword ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
        </button>
      </div>
      {errors.confirmPassword && (
        <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.confirmPassword.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-1 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <CircularProgress size={20} sx={{ color: "white" }} />
        ) : (
          t("register.submit")
        )}
      </button>

      <div className="flex mt-4 text-sm items-center gap-1.5 text-gray-400 dark:text-neutral-400">
        <span>{t("register.hasAccount")}</span>
        <button
          type="button"
          onClick={onLogin}
          className="text-primary font-bold hover:text-primary/80"
        >
          {t("register.login")}
        </button>
      </div>
    </form>
  )
}
