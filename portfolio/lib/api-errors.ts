import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  RequestValidationError,
  getValidationErrorMessage,
} from "@/lib/api-validation";

type ErrorCode =
  | "invalid_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal_error";

function buildErrorPayload(message: string, code: ErrorCode) {
  return {
    error: message,
    message,
    code,
  };
}

export function badRequestResponse(
  message = "Dados da requisição inválidos.",
  code: ErrorCode = "invalid_request",
) {
  return NextResponse.json(buildErrorPayload(message, code), { status: 400 });
}

export function unauthorizedResponse(
  message = "Autenticação necessária.",
) {
  return NextResponse.json(buildErrorPayload(message, "unauthorized"), {
    status: 401,
  });
}

export function forbiddenResponse(message = "Acesso negado.") {
  return NextResponse.json(buildErrorPayload(message, "forbidden"), {
    status: 403,
  });
}

export function notFoundResponse(message = "Recurso não encontrado.") {
  return NextResponse.json(buildErrorPayload(message, "not_found"), {
    status: 404,
  });
}

export function conflictResponse(
  message = "Não foi possível concluir a solicitação.",
) {
  return NextResponse.json(buildErrorPayload(message, "conflict"), {
    status: 409,
  });
}

export function rateLimitResponse(
  message = "Muitas tentativas. Tente novamente em alguns instantes.",
) {
  return NextResponse.json(buildErrorPayload(message, "rate_limited"), {
    status: 429,
  });
}

export function validationErrorResponse(
  error: RequestValidationError | ZodError,
  fallback = "Dados da requisição inválidos.",
) {
  return badRequestResponse(getValidationErrorMessage(error, fallback));
}

export function logApiError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  if (metadata) {
    console.error(`[${context}]`, metadata, error);
  } else {
    console.error(`[${context}]`, error);
  }

  Sentry.withScope((scope) => {
    scope.setTag("api_context", context);
    scope.setFingerprint(["api", context]);

    if (metadata) {
      scope.setContext("metadata", metadata);
    }

    if (error instanceof Error) {
      Sentry.captureException(error);
      return;
    }
    scope.setContext("raw_error", { value: String(error) });
    Sentry.captureMessage(`[${context}] ${String(error)}`, "error");
  });
}

export function internalErrorResponse(
  context: string,
  error: unknown,
  message = "Erro interno.",
  metadata?: Record<string, unknown>,
) {
  logApiError(context, error, metadata);

  return NextResponse.json(buildErrorPayload(message, "internal_error"), {
    status: 500,
  });
}
