import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@romulo/database";
import {
  cleanupIntegrationFixtures,
  TEST_PREFIX,
  uniqueToken,
} from "../../../../testing/integration/fixtures";

const rateLimitMock = vi.hoisted(() => vi.fn());
const getRequestIpMock = vi.hoisted(() => vi.fn(() => "127.0.0.1"));
const createPixChargeMock = vi.hoisted(() => vi.fn());
const paymentIntentsCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  getRequestIp: getRequestIpMock,
}));

vi.mock("@/lib/payments/abacate", () => ({
  createPixCharge: createPixChargeMock,
}));

vi.mock("@/lib/payments/stripe", () => ({
  getStripe: () => ({
    paymentIntents: {
      create: paymentIntentsCreateMock,
    },
  }),
}));

import { POST as createPixDonation } from "../../../app/api/donations/pix/create/route";
import { POST as createStripeIntent } from "../../../app/api/donations/stripe/create-intent/route";

describe("public donation create routes", () => {
  beforeEach(() => {
    rateLimitMock.mockReset();
    rateLimitMock.mockResolvedValue(false);

    createPixChargeMock.mockReset();
    createPixChargeMock.mockResolvedValue({
      id: uniqueToken("pixcharge"),
      brCode: "000201010212",
      brCodeBase64: "data:image/png;base64,abc123",
    });

    paymentIntentsCreateMock.mockReset();
    paymentIntentsCreateMock.mockResolvedValue({
      id: uniqueToken("stripepi"),
      client_secret: "pi_client_secret",
    });
  });

  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("creates a PIX donation record and returns QR code data", async () => {
    const response = await createPixDonation(
      new Request("http://localhost/api/donations/pix/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coffees: 3,
          name: `${TEST_PREFIX}-pix-name`,
          message: `${TEST_PREFIX}-pix-message`,
          isPrivate: false,
          isMonthly: false,
        }),
      }) as any,
    );

    const payload = await response.json();
    const storedDonation = await prisma.donation.findFirst({
      where: { message: `${TEST_PREFIX}-pix-message` },
      orderBy: { createdAt: "desc" },
    });

    expect(response.status).toBe(200);
    expect(payload.pixId).toBeTruthy();
    expect(payload.brCode).toBe("000201010212");
    expect(storedDonation?.provider).toBe("PIX");
    expect(storedDonation?.status).toBe("PENDING");
    expect(storedDonation?.abacatePayChargeId).toBe(payload.pixId);
    expect(storedDonation?.amount).toBe(1500);
  });

  it("returns validation errors for invalid donation payloads", async () => {
    const response = await createPixDonation(
      new Request("http://localhost/api/donations/pix/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coffees: 0,
          name: "",
        }),
      }) as any,
    );

    expect(response.status).toBe(400);
  });

  it("returns rate limited when the PIX route is throttled", async () => {
    rateLimitMock.mockResolvedValueOnce(true);

    const response = await createPixDonation(
      new Request("http://localhost/api/donations/pix/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ coffees: 1 }),
      }) as any,
    );

    expect(response.status).toBe(429);
  });

  it("marks the PIX donation as failed when the provider call fails", async () => {
    createPixChargeMock.mockRejectedValueOnce(new Error("provider down"));

    const response = await createPixDonation(
      new Request("http://localhost/api/donations/pix/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coffees: 2,
          name: `${TEST_PREFIX}-pix-failure`,
          message: `${TEST_PREFIX}-pix-provider-failure`,
        }),
      }) as any,
    );

    const payload = await response.json();
    const storedDonation = await prisma.donation.findFirst({
      where: { message: `${TEST_PREFIX}-pix-provider-failure` },
      orderBy: { createdAt: "desc" },
    });

    expect(response.status).toBe(500);
    expect(payload.code).toBe("internal_error");
    expect(storedDonation?.status).toBe("FAILED");
  });

  it("creates a Stripe intent and pending donation record", async () => {
    const stripeIntentId = uniqueToken("stripe-intent");
    paymentIntentsCreateMock.mockResolvedValueOnce({
      id: stripeIntentId,
      client_secret: "pi_123_secret_456",
    });

    const response = await createStripeIntent(
      new Request("http://localhost/api/donations/stripe/create-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coffees: 5,
          name: `${TEST_PREFIX}-stripe-name`,
          message: `${TEST_PREFIX}-stripe-message`,
          isPrivate: false,
          isMonthly: true,
        }),
      }) as any,
    );

    const payload = await response.json();
    const storedDonation = await prisma.donation.findUnique({
      where: { stripePaymentIntentId: stripeIntentId },
    });

    expect(response.status).toBe(200);
    expect(payload.clientSecret).toBe("pi_123_secret_456");
    expect(storedDonation?.provider).toBe("STRIPE");
    expect(storedDonation?.status).toBe("PENDING");
    expect(storedDonation?.amount).toBe(2500);
    expect(storedDonation?.isMonthly).toBe(true);
  });

  it("returns a safe internal error when Stripe intent creation fails", async () => {
    paymentIntentsCreateMock.mockRejectedValueOnce(new Error("stripe down"));

    const response = await createStripeIntent(
      new Request("http://localhost/api/donations/stripe/create-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coffees: 1,
          name: `${TEST_PREFIX}-stripe-failure`,
          message: `${TEST_PREFIX}-stripe-provider-failure`,
        }),
      }) as any,
    );

    const payload = await response.json();
    const storedDonation = await prisma.donation.findFirst({
      where: { message: `${TEST_PREFIX}-stripe-provider-failure` },
    });

    expect(response.status).toBe(500);
    expect(payload.code).toBe("internal_error");
    expect(storedDonation).toBeNull();
  });
});
