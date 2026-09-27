// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@romulo/database";
import { headers } from "next/headers";
import { AVATAR_SELECT, DEFAULT_AVATAR_STYLE, generateAvatarSeed } from "./avatar";
import { getRequestIp, rateLimit } from "./rate-limit";
import { generateUniqueUsername } from "./username";

type OAuthProvider = "GOOGLE" | "GITHUB";

const ERRORS = {
  accountNotLinked: "/?error=AccountNotLinked",
} as const;

// ── Newsletter linking helper ─────────────────────────────────────────────────
// Called after a user account is created (or found) via OAuth.
// Non-critical: errors are swallowed so they never break the sign-in flow.

async function linkNewsletterIfExists(userId: string, email: string): Promise<void> {
  await prisma.newsletterSubscriber
    .updateMany({
      where: {
        email,
        isConfirmed: true,
        unsubscribedAt: null,
        userId: null, // only link if not already linked
      },
      data: { userId },
    })
    .catch((err) =>
      console.error("[auth] newsletter link failed:", err),
    );
}

async function handleOAuthSignIn(user: any, account: any, provider: OAuthProvider) {
  const email = user.email?.trim().toLowerCase();
  if (!email) return false;

  const sub = account.providerAccountId;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, provider: true, sub: true, admin: true, username: true },
  });

  // E-mail already registered with a different provider
  if (existing && existing.provider !== provider) {
    return ERRORS.accountNotLinked;
  }

  // New user — create
  if (!existing) {
    const username = await generateUniqueUsername(email, user.name);
    const created = await prisma.user.create({
      data: {
        email,
        provider,
        sub,
        username,
        image: user.image ?? null,
        emailVerified: true,
        // Todo usuario OAuth ja nasce com um seedicon pronto, mesmo sem pedir:
        // assim o modal do perfil tem algo para mostrar na primeira abertura.
        // Mas `avatarSource` fica em PROVIDER quando existe foto, para ninguem
        // trocar de cara sozinho ao criar a conta.
        avatarSeed: generateAvatarSeed(),
        avatarStyle: DEFAULT_AVATAR_STYLE,
        avatarSource: user.image ? "PROVIDER" : "SEEDICON",
      },
      select: { id: true, admin: true, username: true },
    });

    user.id = created.id;
    user.provider = provider;
    user.admin = created.admin;
    user.username = created.username;

    // Link newsletter subscription if one already exists for this email
    await linkNewsletterIfExists(created.id, email);

    return true;
  }

  // Existing user with same provider — ensure sub matches
  if (existing.sub && existing.sub !== sub) {
    return ERRORS.accountNotLinked;
  }

  if (!existing.sub) {
    await prisma.user.update({ where: { id: existing.id }, data: { sub } });
  }

  user.id = existing.id;
  user.provider = provider;
  user.admin = existing.admin;
  user.username = existing.username;

  // Existing user signing in — link newsletter if not yet linked
  await linkNewsletterIfExists(existing.id, email);

  return true;
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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

        const headersList = await headers();
        const ip = getRequestIp(headersList);

        const limited = await rateLimit(
          `nextauth:credentials:${ip}:${email}`,
          10,
          60,
          "closed",
        );
        if (limited) throw new Error("RateLimited");

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            admin: true,
            provider: true,
            password: true,
            banned: true,
            ...AVATAR_SELECT,
          },
        });

        if (!user || user.provider !== "EMAIL_PASSWORD" || !user.password) return null;
        if (user.banned) throw new Error("AccountBanned");

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Link newsletter on every credentials sign-in (no-op if already linked)
        await linkNewsletterIfExists(user.id, email);

        return {
          id: user.id,
          email: user.email,
          name: user.username ?? undefined,
          image: user.image ?? undefined,
          provider: user.provider,
          admin: user.admin,
          username: user.username,
          avatarSeed: user.avatarSeed,
          avatarStyle: user.avatarStyle,
          avatarSource: user.avatarSource,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") return handleOAuthSignIn(user, account, "GOOGLE");
      if (account?.provider === "github") return handleOAuthSignIn(user, account, "GITHUB");
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.provider = (user as any).provider;
        token.admin = (user as any).admin;
        token.username = (user as any).username ?? null;
        token.avatarSeed = (user as any).avatarSeed ?? null;
        token.avatarStyle = (user as any).avatarStyle ?? null;
        token.avatarSource = (user as any).avatarSource ?? null;
      }

      // Recarrega do banco em tres situacoes:
      //
      //  - token sem id/provider — o caso que ja existia aqui;
      //  - token emitido antes do avatar existir, sem avatarSeed. Como este
      //    callback roda a cada leitura de sessao, o backfill acontece antes de
      //    qualquer cliente ver uma sessao incompleta;
      //  - trigger "update", que o cliente dispara via useSession().update()
      //    depois de salvar o avatar. E isto que faz a navbar trocar de imagem
      //    sem recarregar a pagina.
      //
      // De proposito NAO lemos o payload de update(): ele vem do cliente, e
      // confiar nele deixaria qualquer um escrever seed e estilo arbitrarios no
      // proprio token — divergindo do banco. A fonte da verdade e sempre o
      // banco, e update() serve so como sinal de "va reler".
      const staleToken = !token.id || !token.provider || !token.avatarSeed;

      if (token.email && (trigger === "update" || staleToken)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, provider: true, admin: true, ...AVATAR_SELECT },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.provider = dbUser.provider;
          token.admin = dbUser.admin;
          token.username = dbUser.username;
          // `picture` e o nome que o NextAuth usa no token para o que vira
          // session.user.image. Ressincronizado junto para o caso da foto do
          // provider ter mudado no banco.
          token.picture = dbUser.image;
          token.avatarSeed = dbUser.avatarSeed;
          token.avatarStyle = dbUser.avatarStyle;
          token.avatarSource = dbUser.avatarSource;
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
        (session.user as any).avatarSeed = (token.avatarSeed as string) ?? null;
        (session.user as any).avatarStyle = (token.avatarStyle as string) ?? null;
        (session.user as any).avatarSource = (token.avatarSource as string) ?? null;
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