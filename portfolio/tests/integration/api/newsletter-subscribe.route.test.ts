import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanupIntegrationFixtures } from "../../../../testing/integration/fixtures";

const rateLimitMock = vi.hoisted(() => vi.fn());
const getRequestIpMock = vi.hoisted(() => vi.fn(() => "127.0.0.1"));
const subscribeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  getRequestIp: getRequestIpMock,
}));

vi.mock("@/lib/newsletter/newsletter.service", () => ({
  subscribe: subscribeMock,
}));

import { POST } from "../../../app/api/newsletter/subscribe/route";

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    rateLimitMock.mockResolvedValue(false);

    subscribeMock.mockReset();
    subscribeMock.mockResolvedValue({ status: "confirmation_sent" });
  });

  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("returns the anti-enumeration success message for valid subscriptions", async () => {
    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "USER@Example.com " }),
      }) as any,
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toBe("Inscrição recebida. Confira seu e-mail para confirmar.");
    expect(subscribeMock).toHaveBeenCalledWith("user@example.com", "pt");
  });

  it("returns validation errors for invalid emails", async () => {
    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }) as any,
    );

    expect(response.status).toBe(400);
  });

  it("returns rate limited when abuse control trips", async () => {
    rateLimitMock.mockResolvedValueOnce(true);

    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "user@example.com" }),
      }) as any,
    );

    expect(response.status).toBe(429);
  });

  it("returns a safe internal error when subscribe fails", async () => {
    subscribeMock.mockRejectedValueOnce(new Error("smtp down"));

    const response = await POST(
      new Request("http://localhost/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "user@example.com" }),
      }) as any,
    );

    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Não consegui registrar sua inscrição agora. Tenta de novo em instantes.");
    expect(payload.code).toBe("internal_error");
  });
});
