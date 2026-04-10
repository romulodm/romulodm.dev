import path from "node:path";

import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";

const PLAYWRIGHT_ADMIN_EMAIL = "phase3-e2e-admin@example.com";
const PLAYWRIGHT_ADMIN_PASSWORD = "Phase3E2E!234";
const PLAYWRIGHT_ADMIN_USERNAME = "phase3e2eadmin";

async function globalSetup(): Promise<void> {
  process.env.PLAYWRIGHT_TEST_BASE_URL ??= "http://127.0.0.1:3100";

  loadEnv({ path: path.resolve(process.cwd(), "../.env"), override: false });
  loadEnv({
    path: path.resolve(process.cwd(), "../packages/database/.env"),
    override: false,
  });

  process.env.DATABASE_URL ??= "postgres://127.0.0.1:5432/portfolio_blog";
  process.env.NEXTAUTH_SECRET ??= "phase-3-e2e-secret";
  process.env.GOOGLE_CLIENT_ID ??= "phase-3-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET ??= "phase-3-google-client-secret";
  process.env.NEXT_PUBLIC_APP_URL ??= "http://127.0.0.1:3100";
  process.env.NEXT_PUBLIC_APP_NAME ??= "romulodm.dev";
  process.env.PLAYWRIGHT_ADMIN_EMAIL = PLAYWRIGHT_ADMIN_EMAIL;
  process.env.PLAYWRIGHT_ADMIN_PASSWORD = PLAYWRIGHT_ADMIN_PASSWORD;

  const { prisma } = await import("@romulo/database");
  const password = await bcrypt.hash(PLAYWRIGHT_ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: PLAYWRIGHT_ADMIN_EMAIL },
    update: {
      admin: true,
      banned: false,
      emailVerified: true,
      password,
      provider: "EMAIL_PASSWORD",
      username: PLAYWRIGHT_ADMIN_USERNAME,
    },
    create: {
      admin: true,
      banned: false,
      email: PLAYWRIGHT_ADMIN_EMAIL,
      emailVerified: true,
      password,
      provider: "EMAIL_PASSWORD",
      username: PLAYWRIGHT_ADMIN_USERNAME,
    },
  });

  await prisma.$disconnect();
}

export default globalSetup;
