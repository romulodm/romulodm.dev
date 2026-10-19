import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

// The confirmation e-mail goes through BullMQ/Redis, which these database
// tests do not run. What matters here is that sign-up asks for it.
const sendEmailVerificationMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email-verification", () => ({
  sendEmailVerification: sendEmailVerificationMock,
}));

import { POST } from "../../../app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    rateLimitMock.mockResolvedValue(false);
    sendEmailVerificationMock.mockReset();
    sendEmailVerificationMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("creates a user in the real database", async () => {
    const email = `${uniqueToken("register")}@example.com`;
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password: "password-123",
          username: "phase3register",
        }),
      }) as any,
    );

    const payload = await response.json();
    const created = await prisma.user.findUnique({
      where: { email },
    });

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(created?.provider).toBe("EMAIL_PASSWORD");
    expect(created?.password).not.toBe("password-123");
    expect(created?.emailVerified).toBe(false);
    expect(created?.usernameChosenAt).not.toBeNull();
    expect(sendEmailVerificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: created?.id, email }),
      expect.any(String),
    );
  });

  it("stores the username normalized to lowercase", async () => {
    const email = `${uniqueToken("lower")}@example.com`;
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "password-123", username: "@Phase3Lower" }),
      }) as any,
    );

    const created = await prisma.user.findUnique({ where: { email } });
    expect(response.status).toBe(201);
    expect(created?.username).toBe("phase3lower");
  });

  it("rejects a missing username instead of deriving one from the e-mail", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: `${uniqueToken("nouser")}@example.com`,
          password: "password-123",
        }),
      }) as any,
    );

    expect(response.status).toBe(400);
  });

  it("still creates the account when the confirmation e-mail cannot be queued", async () => {
    sendEmailVerificationMock.mockRejectedValue(new Error("redis down"));
    const email = `${uniqueToken("noqueue")}@example.com`;
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "password-123", username: "phase3noqueue" }),
      }) as any,
    );

    expect(response.status).toBe(201);
  });

  it("returns conflict for an existing email", async () => {
    const email = `${uniqueToken("existing")}@example.com`;
    await prisma.user.create({
      data: {
        email,
        username: uniqueToken("existinguser").slice(0, 24),
        provider: "EMAIL_PASSWORD",
        password: "hash",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password: "password-123",
          username: "phase3existing",
        }),
      }) as any,
    );

    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.code).toBe("conflict");
  });

  it("returns validation errors for invalid payloads", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "invalid",
          password: "short",
        }),
      }) as any,
    );

    expect(response.status).toBe(400);
  });

  it("returns a rate limit response when the limiter trips", async () => {
    rateLimitMock.mockResolvedValue(true);

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: `${uniqueToken("limited")}@example.com`,
          password: "password-123",
          username: "phase3limited",
        }),
      }) as any,
    );

    expect(response.status).toBe(429);
  });
});
