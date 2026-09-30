// components/auth/LoginForm.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { toast } from "react-toastify"
import { Loader2 } from "lucide-react"
import { MdOutlineAlternateEmail } from "react-icons/md"
import { RiLockPasswordLine } from "react-icons/ri"
import { MdVisibility, MdVisibilityOff } from "react-icons/md"
import { useTranslations } from "next-intl"

import { createLoginSchema, type LoginValues } from "./schemas"
import { GoogleButton } from "./GoogleButton"
import { GitHubButton } from "./GitHubButton"
import { PasswordButton } from "./PasswordButton"

interface Props {
  onSuccess: () => void
  onForgotPassword: () => void
  onRegister: () => void
}

export function LoginForm({ onSuccess, onForgotPassword, onRegister }: Props) {
  const t = useTranslations("auth")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const schema = createLoginSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: LoginValues) {
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (!res?.ok) {
      const err = res?.error
      if (err === "RateLimited") {
        toast.error(t("toasts.rateLimited"))
      } else if (err === "AccountBanned") {
        toast.error(t("toasts.accountBanned"))
      } else {
        toast.error(t("toasts.invalidCredentials"))
      }
      return
    }

    toast.success(t("toasts.loginSuccess"))
    onSuccess()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col items-center w-full"
    >
      <div className="w-full flex flex-col gap-2">
        <GoogleButton disabled={isSubmitting} />
        <GitHubButton disabled={isSubmitting} />
        <div className="flex w-full items-center gap-2 my-2 text-xs text-gray-300 dark:text-neutral-600">
          <hr className="flex-1 border-gray-200 dark:border-neutral-700" />
          {t("common.or")}
          <hr className="flex-1 border-gray-200 dark:border-neutral-700" />
        </div>
        {!showPasswordForm && (
          <PasswordButton
            label={t("password.signIn")}
            onClick={() => setShowPasswordForm(true)}
            disabled={isSubmitting}
          />
        )}
      </div>

      {showPasswordForm && (
        <>
          <div
            className={`h-12 mt-1 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-4 border ${errors.email ? "border-red-400" : "border-transparent"}`}
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
            className={`h-12 w-full bg-neutral-200/90 dark:bg-neutral-800 rounded-lg flex items-center mb-1 border ${errors.password ? "border-red-400" : "border-transparent"}`}
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
              <Loader2 aria-hidden className="size-5 animate-spin" />
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
        </>
      )}

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