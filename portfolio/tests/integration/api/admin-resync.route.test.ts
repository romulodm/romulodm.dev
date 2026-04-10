import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@romulo/database";
import {
  cleanupIntegrationFixtures,
  createComment,
  createPublishedPost,
  createTestUser,
} from "../../../../testing/integration/fixtures";

const requireAdminMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireAdmin: requireAdminMock,
}));

import { POST } from "../../../app/api/admin/resync/route";

describe("POST /api/admin/resync", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({
      ok: true,
      user: { id: "admin-user-id", admin: true },
    });
  });

  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("recomputes commentsCount from the real database", async () => {
    const admin = await createTestUser({ admin: true });
    const author = await createTestUser();
    const post = await createPublishedPost(author.id, { commentsCount: 0 });

    await createComment(author.id, post.id, "first");
    await createComment(author.id, post.id, "second");

    requireAdminMock.mockResolvedValue({
      ok: true,
      user: { id: admin.id, admin: true },
    });

    const response = await POST(new Request("http://localhost/api/admin/resync", {
      method: "POST",
    }) as any);

    const payload = await response.json();
    const refreshed = await prisma.post.findUnique({
      where: { id: post.id },
      select: { commentsCount: true },
    });

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.synced).toBeGreaterThanOrEqual(1);
    expect(refreshed?.commentsCount).toBe(2);
  });

  it("returns unauthorized when admin auth is missing", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      status: 401,
      reason: "unauthorized",
    });

    const response = await POST(new Request("http://localhost/api/admin/resync", {
      method: "POST",
    }) as any);

    expect(response.status).toBe(401);
  });

  it("returns forbidden when the user is authenticated but not an admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      status: 403,
      reason: "forbidden",
    });

    const response = await POST(new Request("http://localhost/api/admin/resync", {
      method: "POST",
    }) as any);

    expect(response.status).toBe(403);
  });
});
