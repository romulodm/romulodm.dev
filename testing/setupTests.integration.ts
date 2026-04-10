import path from "node:path";

import { config as loadEnv } from "dotenv";

process.env.NODE_ENV = "test";
process.env.TEST_SUITE = "integration";

loadEnv({ path: path.resolve(process.cwd(), ".env"), override: false });
loadEnv({
  path: path.resolve(process.cwd(), "packages/database/.env"),
  override: false,
});

process.env.TEST_DATABASE_URL ??= process.env.DATABASE_URL ?? "postgres://127.0.0.1:5432/portfolio_blog";
process.env.TEST_REDIS_URL ??= process.env.REDIS_URL ?? "redis://127.0.0.1:6379/15";
process.env.DATABASE_URL ??= process.env.TEST_DATABASE_URL;
process.env.REDIS_URL ??= process.env.TEST_REDIS_URL;
process.env.NEXTAUTH_SECRET ??= "phase-3-test-secret";
process.env.GOOGLE_CLIENT_ID ??= "phase-3-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "phase-3-google-client-secret";
process.env.NEXT_PUBLIC_APP_URL ??= "http://127.0.0.1:3000";
process.env.NEXT_PUBLIC_APP_NAME ??= "romulodm.dev";
