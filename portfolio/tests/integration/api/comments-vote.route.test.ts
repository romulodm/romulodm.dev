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

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: requireAuthMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  getRequestIp: getRequestIpMock,
}));

import { PUT } from "../../../app/api/comments/[id]/vote/route";

function putVote(commentId: string, value: number) {
  return PUT(
    new Request(`http://localhost/api/comments/${commentId}/vote`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
    }) as any,
    { params: Promise.resolve({ id: commentId }) },
  );
}

function actAs(userId: string) {
  requireAuthMock.mockResolvedValue({
    ok: true,
    user: { id: userId, admin: false },
  });
}

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
      { params: Promise.resolve({ id: comment.id }) },
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
      { params: Promise.resolve({ id: "comment-id" }) },
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
      { params: Promise.resolve({ id: comment.id }) },
    );

    expect(response.status).toBe(400);
  });

  it("rejects a downvote when the score is already 0", async () => {
    const author = await createTestUser();
    const voter = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    actAs(voter.id);
    const response = await putVote(comment.id, -1);

    const refreshed = await prisma.comment.findUnique({
      where: { id: comment.id },
      select: { score: true },
    });
    expect(response.status).toBe(409);
    expect(refreshed?.score).toBe(0);
    expect(await prisma.commentVote.count({ where: { commentId: comment.id } })).toBe(0);
  });

  it("accepts a downvote that brings the score from 1 to 0", async () => {
    const author = await createTestUser();
    const upvoter = await createTestUser();
    const downvoter = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    actAs(upvoter.id);
    await putVote(comment.id, 1);

    actAs(downvoter.id);
    const response = await putVote(comment.id, -1);

    expect(response.status).toBe(200);
    expect((await response.json()).score).toBe(0);
  });

  it("does not let a voter flip their own upvote into a downvote below 0", async () => {
    const author = await createTestUser();
    const voter = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    actAs(voter.id);
    await putVote(comment.id, 1);
    const response = await putVote(comment.id, -1);

    expect(response.status).toBe(409);
  });

  it("clamps the score at 0 when an upvote is retracted after a downvote", async () => {
    const author = await createTestUser();
    const upvoter = await createTestUser();
    const downvoter = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    actAs(upvoter.id);
    await putVote(comment.id, 1);
    actAs(downvoter.id);
    await putVote(comment.id, -1);
    actAs(upvoter.id);
    const response = await putVote(comment.id, 0);

    expect(response.status).toBe(200);
    expect((await response.json()).score).toBe(0);
  });

  it("rejects votes on the voter's own comment", async () => {
    const author = await createTestUser();
    const post = await createPublishedPost(author.id);
    const comment = await createComment(author.id, post.id);

    actAs(author.id);
    const response = await putVote(comment.id, 1);

    expect(response.status).toBe(403);
  });

  it("returns 404 for a comment that does not exist", async () => {
    const voter = await createTestUser();

    actAs(voter.id);
    const response = await putVote("missing-comment-id", 1);

    expect(response.status).toBe(404);
  });

  it("blocks voting for accounts that mostly downvote, but still allows retracting", async () => {
    const author = await createTestUser();
    const upvoter = await createTestUser();
    const abuser = await createTestUser();
    const post = await createPublishedPost(author.id);

    const comments = [];
    for (let i = 0; i < 6; i++) {
      comments.push(await createComment(author.id, post.id, `comment ${i}`));
    }

    // Give every comment a positive score so the downvotes are accepted.
    actAs(upvoter.id);
    for (const comment of comments) {
      await putVote(comment.id, 1);
    }

    actAs(abuser.id);
    for (const comment of comments.slice(0, 5)) {
      expect((await putVote(comment.id, -1)).status).toBe(200);
    }

    const blocked = await putVote(comments[5].id, 1);
    expect(blocked.status).toBe(403);

    const retract = await putVote(comments[0].id, 0);
    expect(retract.status).toBe(200);
  });
});
