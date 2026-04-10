import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@romulo/database";
import {
  cleanupIntegrationFixtures,
  createPublishedPost,
  createTestUser,
} from "../../../../testing/integration/fixtures";

describe("prisma roundtrip integration", () => {
  afterEach(async () => {
    await cleanupIntegrationFixtures();
  });

  it("persists and reloads published posts through the real database", async () => {
    const user = await createTestUser();
    const post = await createPublishedPost(user.id, {
      commentsCount: 3,
    });

    const persisted = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        translations: true,
      },
    });

    expect(persisted).toBeTruthy();
    expect(persisted?.slug).toContain("phase3test");
    expect(persisted?.commentsCount).toBe(3);
    expect(persisted?.translations[0]?.title).toContain("Title");
  });
});
