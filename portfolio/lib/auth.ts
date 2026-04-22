// lib/auth.ts
import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@romulo/database";
import { headers } from "next/headers";
import { rateLimit } from "./rate-limit";
import { generateUniqueUsername } from "./username";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== 'production',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // authorization: { params: { prompt: "consent", access_type: "offline", response_type: "code" } }
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        // ── Rate limit via IP ──────────────────────────────────────
        const headersList = await headers();
        const ip =
          headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headersList.get("x-real-ip") ??
          "unknown";

        const limited = await rateLimit(`nextauth:credentials:${ip}:${email}`, 10, 60);
        if (limited) throw new Error("CredentialsSignin"); // NextAuth trata como login inválido

        // ── Busca usuário ─────────────────────────────────────────
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true, email: true, username: true,
            image: true, admin: true, provider: true, password: true,
          },
        });

        if (!user || user.provider !== "EMAIL_PASSWORD" || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username ?? undefined,
          image: user.image ?? undefined,
          provider: user.provider,
          admin: user.admin,
          username: user.username,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      // ----- GOOGLE LOGIN FLOW -----
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;

        const sub = account.providerAccountId; // id estável do provider (Google "sub")

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, provider: true, sub: true, admin: true, username: true },
        });

        // existe mas foi criado com senha -> bloqueia Google
        if (existing && existing.provider !== "GOOGLE") {
          return false;
        }

        // não existe -> cria com GOOGLE
        if (!existing) {
          const username = await generateUniqueUsername(email, user.name);

          const created = await prisma.user.create({
            data: {
              email,
              provider: "GOOGLE",
              sub,
              username,
              image: user.image ?? null,
              emailVerified: true,
            },
            select: { id: true, admin: true, username: true },
          });

          user.id = created.id;
          (user as any).provider = "GOOGLE";
          (user as any).admin = created.admin;
          (user as any).username = created.username;
          return true;
        }

        // existe e é GOOGLE -> garante sub e atualiza se necessário
        if (existing.sub && existing.sub !== sub) return false;

        if (!existing.sub) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { sub },
          });
        }

        user.id = existing.id;
        (user as any).provider = "GOOGLE";
        (user as any).admin = existing.admin;
        (user as any).username = existing.username;
        return true;
      }

      // ----- CREDENTIALS FLOW -----
      return true;
    },

    async jwt({ token, user }) {
      // primeira vez após login
      if (user) {
        token.id = user.id;
        token.provider = (user as any).provider;
        token.admin = (user as any).admin;
        token.username = (user as any).username ?? null;
      }

      // garante que token tenha provider/admin quando refresh
      if (token.email && (!token.id || !token.provider)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, provider: true, admin: true, username: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.provider = dbUser.provider;
          token.admin = dbUser.admin;
          token.username = dbUser.username;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).provider = token.provider as any;
        (session.user as any).admin = Boolean(token.admin);
        (session.user as any).username = (token.username as string) ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
