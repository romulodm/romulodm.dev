import { z } from "zod"

type Translate = (key: string) => string

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

/**
 * Locale-free versions of the schemas, for use outside a component (tests).
 * Each error message is the translation key itself; the forms build their
 * schemas through the create*Schema factories with next-intl's `t`, so no
 * user-facing copy lives in this file.
 */
const keyAsMessage: Translate = (key) => key

export function createLoginSchema(t: Translate) {
    return z.object({
        email: z.string().email(t("validation.emailInvalid")),
        password: z.string().min(1, t("validation.passwordRequired")),
    })
}

export function createRegisterSchema(t: Translate) {
    return z
        .object({
            username: z.string().min(2, t("validation.usernameTooShort")).max(80),
            email: z.string().email(t("validation.emailInvalid")),
            password: z.string().min(8, t("validation.passwordMin")).max(100),
            confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("validation.passwordsDoNotMatch"),
            path: ["confirmPassword"],
        })
}

export function createForgotPasswordSchema(t: Translate) {
    return z.object({
        email: z.string().email(t("validation.emailInvalid")),
    })
}

export function createResetPasswordSchema(t: Translate) {
    return z
        .object({
            password: z.string().min(8, t("validation.passwordMin")).max(100),
            confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("validation.passwordsDoNotMatch"),
            path: ["confirmPassword"],
        })
}

export const loginSchema = createLoginSchema(keyAsMessage)
export const registerSchema = createRegisterSchema(keyAsMessage)
export const forgotPasswordSchema = createForgotPasswordSchema(keyAsMessage)
export const resetPasswordSchema = createResetPasswordSchema(keyAsMessage)
