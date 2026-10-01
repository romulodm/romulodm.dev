import "server-only";

import { prisma } from "@romulo/database";

import {
  deleteMediaObjects,
  isCoverKey,
  isValidPostId,
  listPostMediaKeys,
  postMediaPrefix,
} from "@/lib/s3";

// Campaign states in which at least some emails may already be in inboxes.
// SCHEDULED is left out: the worker renders the cover at send time, so a
// campaign that has not gone out yet picks up whatever cover is current.
const SENT_CAMPAIGN_STATUSES = ["SENDING", "SENT", "FAILED"] as const;

/**
 * Deletes the objects under posts/<postId>/ that nothing references anymore
 * and returns the deleted keys.
 *
 * An object counts as referenced when its key appears verbatim in any post
 * cover, any translation's markdown (of this post or another one that
 * borrowed the image), or any stored campaign HTML. Matching the key instead
 * of parsing markdown makes the check independent of how the image is
 * embedded (markdown, raw <img>, reference link) and of the URL host, which
 * differs between local MinIO and production's /media/ path.
 *
 * Covers get one extra rule: once the post has gone out in a newsletter, the
 * emails already delivered point at whichever cover was current at send time,
 * and there is no record of which one that was. Replaced covers of such a
 * post are kept rather than breaking images in subscribers' inboxes.
 *
 * Run it only after a save has been committed: it trusts the database as the
 * complete picture of what the post uses.
 */
export async function sweepUnusedPostMedia(postId: string): Promise<string[]> {
  if (!isValidPostId(postId)) return [];

  const keys = await listPostMediaKeys(postId);
  if (keys.length === 0) return [];

  const prefix = postMediaPrefix(postId);

  const [covers, translations, campaigns, sentCampaigns] = await Promise.all([
    prisma.post.findMany({
      where: { coverImageUrl: { contains: prefix } },
      select: { coverImageUrl: true },
    }),
    prisma.postTranslation.findMany({
      where: { contentMarkdown: { contains: prefix } },
      select: { contentMarkdown: true },
    }),
    prisma.campaign.findMany({
      where: { content: { contains: prefix } },
      select: { content: true },
    }),
    prisma.campaign.count({
      where: {
        status: { in: [...SENT_CAMPAIGN_STATUSES] },
        OR: [{ postId }, { campaignPosts: { some: { postId } } }],
      },
    }),
  ]);

  const references = [
    ...covers.map((post) => post.coverImageUrl ?? ""),
    ...translations.map((translation) => translation.contentMarkdown),
    ...campaigns.map((campaign) => campaign.content),
  ].join("\n");

  const keepReplacedCovers = sentCampaigns > 0;

  const unused = keys.filter((key) => {
    if (references.includes(key)) return false;
    if (keepReplacedCovers && isCoverKey(key)) return false;
    return true;
  });

  await deleteMediaObjects(unused);
  return unused;
}
