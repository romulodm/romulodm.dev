import { z } from "zod"

type Translate = (key: string) => string

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export const loginSchema = z.object({
    email: z.string().email("E-mail inválido."),
    password: z.string().min(1, "Senha obrigatória."),
})

export const registerSchema = z
    .object({
        username: z.string().min(2, "Username muito curto.").max(80),
        email: z.string().email("E-mail inválido."),
        password: z.string().min(8, "Mínimo 8 caracteres.").max(100),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
    })

export const forgotPasswordSchema = z.object({
    email: z.string().email("E-mail inválido."),
})

export const resetPasswordSchema = z
    .object({
        password: z.string().min(8, "Mínimo 8 caracteres.").max(100),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
    })

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
