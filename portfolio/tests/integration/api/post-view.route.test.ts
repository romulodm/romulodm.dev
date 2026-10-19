import { afterEach, describe, expect, it } from "vitest";

import { VIEWS_BUFFER_KEY } from "@romulo/queues";
// A conexao saiu do pacote de filas para portfolio/lib/redis.ts.
import { getRedis } from "@/lib/redis";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../../testing/integration/fixtures";
import { GET, POST } from "../../../app/api/posts/[id]/view/route";

async function cleanupRedis() {
  const redis = getRedis();
  await redis.del(VIEWS_BUFFER_KEY);

  const capKeys = await redis.keys("views:cap:*");
  if (capKeys.length > 0) {
    await redis.del(...capKeys);
  }
}

describe("POST /api/posts/[id]/view", () => {
  afterEach(async () => {
    await cleanupRedis();
    await cleanupIntegrationFixtures();
  });

  it("counts every request as a page view through the shared buffered path", async () => {
    const redis = getRedis();

    const author = await createTestUser();
    const post = await createPublishedPost(author.id);

    const firstResponse = await POST(
      new Request(`http://localhost/api/posts/${post.id}/view`, {
        method: "POST",
      }) as any,
      { params: Promise.resolve({ id: post.id }) },
    );

    const secondResponse = await POST(
      new Request(`http://localhost/api/posts/${post.id}/view`, {
        method: "POST",
      }) as any,
      { params: Promise.resolve({ id: post.id }) },
    );

    // Page views, not sessions: a second load by the same reader counts too.
    expect(await firstResponse.json()).toEqual({ counted: true });
    expect(await secondResponse.json()).toEqual({ counted: true });
    expect(await redis.hget(VIEWS_BUFFER_KEY, post.id)).toBe("2");

    await redis.quit();
  });

  it("returns a gone response for the removed route-local flush endpoint", async () => {
    const response = await GET(
      new Request("http://localhost/api/posts/post-id/view", {
        method: "GET",
      }) as any,
    );

    expect(response.status).toBe(410);
  });
});
