import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./schemas";

describe("auth schemas", () => {
  it("accepts valid login payloads", () => {
    const result = loginSchema.safeParse({
      email: "romulo@example.com",
      password: "super-secret",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid login payloads", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeTruthy();
      expect(result.error.flatten().fieldErrors.password).toBeTruthy();
    }
  });

  it("requires matching passwords during registration", () => {
    const result = registerSchema.safeParse({
      username: "romulo",
      email: "romulo@example.com",
      password: "password-123",
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "validation.passwordsDoNotMatch",
      );
    }
  });

  it("validates forgot/reset password payloads", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "romulo@example.com" }).success,
    ).toBe(true);

    const reset = resetPasswordSchema.safeParse({
      password: "password-123",
      confirmPassword: "password-123",
    });

    expect(reset.success).toBe(true);
  });
});
