import { z, ZodError } from "zod";

export class RequestValidationError extends Error {
  issues?: Record<string, string[] | undefined>;

  constructor(message: string, issues?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "RequestValidationError";
    this.issues = issues;
  }
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizePlainText(value: string, maxLength?: number) {
  const sanitized = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return typeof maxLength === "number"
    ? sanitized.slice(0, maxLength)
    : sanitized;
}

export function sanitizeMultilineText(value: string, maxLength?: number) {
  const sanitized = value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();

  return typeof maxLength === "number"
    ? sanitized.slice(0, maxLength)
    : sanitized;
}

export function sanitizeHtmlFragment(value: string, maxLength?: number) {
  const withoutScripts = value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .trim();

  return typeof maxLength === "number"
    ? withoutScripts.slice(0, maxLength)
    : withoutScripts;
}

export function optionalPlainText(value: unknown, maxLength?: number) {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = sanitizePlainText(value, maxLength);
  return sanitized.length > 0 ? sanitized : null;
}

export function getValidationErrorMessage(
  error: RequestValidationError | ZodError,
  fallback = "Dados da requisição inválidos.",
) {
  if (error instanceof RequestValidationError) {
    return error.message;
  }

  return error.errors[0]?.message ?? fallback;
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    throw new RequestValidationError("Corpo da requisição inválido.");
  }

  const parsed = await schema.safeParseAsync(rawBody);
  if (!parsed.success) {
    throw new RequestValidationError(
      getValidationErrorMessage(parsed.error),
      parsed.error.flatten().fieldErrors,
    );
  }

  return parsed.data;
}

export const emailSchema = z
  .string({ required_error: "E-mail é obrigatório." })
  .trim()
  .min(1, "E-mail é obrigatório.")
  .email("E-mail inválido.")
  .transform(normalizeEmail);

export const passwordSchema = z
  .string({ required_error: "Senha é obrigatória." })
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.");
