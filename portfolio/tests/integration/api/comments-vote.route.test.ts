import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@romulo/database";
import {
  cleanupIntegrationFixtures,
  createComment,
  createPublishedPost,
  createTestUser,
} from "../../../../testing/integration/fixtures";

const requireAuthMock = vi.hoisted(() => vi.fn());
const rateLimitMock = vi.hoisted(() => vi.fn());
const getRequestIpMock = vi.hoisted(() => vi.fn(() => "127.0.0.1"));

vi.mock("@/lib/auth", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  getRequestIp: getRequestIpMock,
}));

import { PUT } from "../../../app/api/comments/[id]/vote/route";

describe("PUT /api/comments/[id]/vote", () => {
  beforeEach(() => {
    requireAuthMock.mockReset();
    requireAuthMock.mockResolvedValue({
      ok: true,
      user: { id: "placeholder-user-id", admin: false },
    });

    rateLimitMock.mockReset();
    rateLimitMock.mockResolvedValue(false);
  });

  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("creates or updates a vote and recalculates the score", async () => {
    const author = await createTestUser();
    const voter = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    requireAuthMock.mockResolvedValue({
      ok: true,
      user: { id: voter.id, admin: false },
    });

    const response = await PUT(
      new Request(`http://localhost/api/comments/${comment.id}/vote`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: 1 }),
      }) as any,
      { params: { id: comment.id } },
    );

    const payload = await response.json();
    const storedVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId: comment.id,
          userId: voter.id,
        },
      },
    });
    const refreshedComment = await prisma.comment.findUnique({
      where: { id: comment.id },
      select: { score: true },
    });

    expect(response.status).toBe(200);
    expect(payload.score).toBe(1);
    expect(storedVote?.value).toBe(1);
    expect(refreshedComment?.score).toBe(1);
  });

  it("returns unauthorized when auth fails", async () => {
    requireAuthMock.mockResolvedValue({
      ok: false,
      status: 401,
      reason: "unauthorized",
    });

    const response = await PUT(
      new Request("http://localhost/api/comments/comment-id/vote", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: 1 }),
      }) as any,
      { params: { id: "comment-id" } },
    );

    expect(response.status).toBe(401);
  });

  it("returns validation errors for invalid vote values", async () => {
    const author = await createTestUser();
    const voter = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    requireAuthMock.mockResolvedValue({
      ok: true,
      user: { id: voter.id, admin: false },
    });

    const response = await PUT(
      new Request(`http://localhost/api/comments/${comment.id}/vote`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: 2 }),
      }) as any,
      { params: { id: comment.id } },
    );

    expect(response.status).toBe(400);
  });
});
