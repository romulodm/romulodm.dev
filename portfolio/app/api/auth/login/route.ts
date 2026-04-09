import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@romulo/database";
import { SignJWT } from "jose";

import {
  internalErrorResponse,
  rateLimitResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-errors";
import {
  emailSchema,
  parseJsonBody,
  passwordSchema,
  RequestValidationError,
} from "@/lib/api-validation";
import { getRequestIp, rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export async function POST(req: Request) {
  try {
    const { email, password } = await parseJsonBody(req, loginSchema);

    const ip = getRequestIp(req);
    const limited = await rateLimit(`auth:login:${ip}:${email}`, 10, 60);
    if (limited) {
      return rateLimitResponse("Muitas tentativas de login. Aguarde um momento.");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        provider: true,
        admin: true,
      },
    });

    if (!user || user.provider !== "EMAIL_PASSWORD" || !user.password) {
      return unauthorizedResponse("Credenciais inválidas.");
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return unauthorizedResponse("Credenciais inválidas.");
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return internalErrorResponse(
        "auth-login",
        new Error("NEXTAUTH_SECRET is not configured"),
      );
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      username: user.username,
      admin: user.admin,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      admin: user.admin,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof RequestValidationError) {
      return validationErrorResponse(error);
    }

    return internalErrorResponse("auth-login", error);
  }
}
