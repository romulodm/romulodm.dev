import { describe, expect, it } from "vitest";

import {
  campaignTemplate,
  confirmationTemplate,
  passwordResetTemplate,
  welcomeTemplate,
} from "./templates";

describe("email templates", () => {
  it("renders the confirmation email with the provided URL", () => {
    const html = confirmationTemplate("https://example.com/confirm?token=abc");

    expect(html).toContain("Confirme sua inscrição");
    expect(html).toContain("https://example.com/confirm?token=abc");
  });

  it("renders the welcome email with the unsubscribe URL", () => {
    const html = welcomeTemplate("https://example.com/unsubscribe");

    expect(html).toContain("Bem-vindo");
    expect(html).toContain("https://example.com/unsubscribe");
  });

  it("renders the password reset code and expiry", () => {
    const html = passwordResetTemplate({
      code: "123456",
      expiresInMinutes: 30,
    });

    expect(html).toContain("123456");
    expect(html).toContain("30 minutos");
  });

  it("renders campaign content, unsubscribe link, and tracking pixel", () => {
    const html = campaignTemplate({
      subject: "Hello",
      content: "<p>newsletter body</p>",
      unsubscribeUrl: "https://example.com/unsub",
      trackingPixelUrl: "https://example.com/pixel",
    });

    expect(html).toContain("<p>newsletter body</p>");
    expect(html).toContain("https://example.com/unsub");
    expect(html).toContain("https://example.com/pixel");
  });
});
