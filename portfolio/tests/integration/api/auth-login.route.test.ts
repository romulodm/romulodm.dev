import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

import { prisma } from "@romulo/database";
import {
  cleanupIntegrationFixtures,
  uniqueToken,
} from "../../../../testing/integration/fixtures";

const rateLimitMock = vi.hoisted(() => vi.fn());
const getRequestIpMock = vi.hoisted(() => vi.fn(() => "127.0.0.1"));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  getRequestIp: getRequestIpMock,
}));

import { POST } from "../../../app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    rateLimitMock.mockResolvedValue(false);
  });

  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("returns a signed token for valid credentials", async () => {
    const email = `${uniqueToken("login")}@example.com`;
    const password = "password-123";

    await prisma.user.create({
      data: {
        email,
        username: uniqueToken("loginuser").slice(0, 24),
        provider: "EMAIL_PASSWORD",
        password: await bcrypt.hash(password, 12),
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.token).toBeTruthy();
    expect(payload.email).toBe(email);
  });

  it("returns unauthorized for invalid credentials", async () => {
    const email = `${uniqueToken("wrong-login")}@example.com`;

    await prisma.user.create({
      data: {
        email,
        username: uniqueToken("wronguser").slice(0, 24),
        provider: "EMAIL_PASSWORD",
        password: await bcrypt.hash("password-123", 12),
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "wrong-pass" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns validation errors for invalid payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "bad", password: "short" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
