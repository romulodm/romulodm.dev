// components/auth/LoginForm.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import CircularProgress from "@mui/material/CircularProgress"
import { MdOutlineAlternateEmail } from "react-icons/md"
import { RiLockPasswordLine } from "react-icons/ri"
import { MdVisibility, MdVisibilityOff } from "react-icons/md"
import { useTranslations } from "next-intl"

import { createLoginSchema, type LoginValues } from "./schemas"
import { GoogleButton } from "./GoogleButton"

interface Props {
  onSuccess: () => void
  onForgotPassword: () => void
  onRegister: () => void
}

export function LoginForm({ onSuccess, onForgotPassword, onRegister }: Props) {
  const t = useTranslations("auth")
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const schema = createLoginSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: LoginValues) {
    setServerError(null)

    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (!res?.ok) {
      setServerError(t("login.invalidCredentials"))
      return
    }

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

      <GoogleButton disabled={isSubmitting} />

      <div className="flex w-full items-center gap-2 my-4 text-xs text-gray-300 dark:text-neutral-600">
        <hr className="flex-1 border-gray-200 dark:border-neutral-700" />
        {t("common.or")}
        <hr className="flex-1 border-gray-200 dark:border-neutral-700" />
      </div>

      <div
        className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.email ? "border-red-400" : "border-transparent"
          }`}
      >
        <MdOutlineAlternateEmail
          className={`ml-3 text-lg shrink-0 ${errors.email ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
        />
        <input
          {...register("email")}
          placeholder={t("login.emailPlaceholder")}
          type="email"
          autoComplete="email"
          className="flex-1 bg-transparent dark:text-neutral-100 text-gray-800 px-2 outline-none text-sm"
        />
      </div>
      {errors.email && (
        <p className="w-full -mt-3 mb-3 text-xs text-red-500">{errors.email.message}</p>
      )}

      <div
        className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-1 border ${errors.password ? "border-red-400" : "border-transparent"
          }`}
      >
        <RiLockPasswordLine
          className={`ml-3 text-lg shrink-0 ${errors.password ? "text-red-400" : "text-gray-400 dark:text-neutral-400"}`}
        />
        <input
          {...register("password")}
          placeholder={t("login.passwordPlaceholder")}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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
        <p className="w-full mb-2 text-xs text-red-500">{errors.password.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <CircularProgress size={20} sx={{ color: "white" }} />
        ) : (
          t("login.submit")
        )}
      </button>

      <button
        type="button"
        onClick={onForgotPassword}
        className="mt-2 self-start text-xs text-gray-500 dark:text-neutral-400 hover:underline"
      >
        {t("login.forgotPassword")}
      </button>

      <div className="flex mt-4 text-sm items-center gap-1.5 text-gray-400 dark:text-neutral-400">
        <span>{t("login.noAccount")}</span>
        <button
          type="button"
          onClick={onRegister}
          className="text-primary font-bold hover:text-primary/80"
        >
          {t("login.createNow")}
        </button>
      </div>
    </form>
  )
}
