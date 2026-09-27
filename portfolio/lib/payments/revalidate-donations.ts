// lib/payments/revalidate-donations.ts

import { revalidatePath, revalidateTag } from "next/cache";

import { logApiError } from "@/lib/api-errors";

/**
 * Tag of the `unstable_cache` entry behind /api/donations/ranking. Exported so
 * the cache and its invalidation cannot drift apart by a typo.
 */
export const DONATION_RANKING_TAG = "donation-ranking";

/**
 * Drops every cached view that lists confirmed donations, so a new coffee shows
 * up on the next request instead of after the 5-minute `revalidate` window.
 *
 * Call it only after a donation actually reached COMPLETED. Redeliveries and
 * `already_completed` outcomes change nothing on screen and do not need it.
 *
 * Both invalidations are needed: the /support page is ISR (`revalidatePath`
 * clears it), while the ranking API reads through `unstable_cache`, which
 * `revalidatePath` does not touch.
 *
 * `{ expire: 0 }` because the donor is usually looking at the page right after
 * paying; stale-while-revalidate would show them the old list one more time.
 *
 * Best effort by design. The payment is already settled in the database when
 * this runs; letting a cache failure throw would turn a successful webhook into
 * a 500 and make the provider redeliver an event that was handled correctly.
 * The worst outcome of swallowing the error is the old 5-minute delay.
 */
export function revalidateDonationViews(): void {
    try {
        revalidateTag(DONATION_RANKING_TAG, { expire: 0 });
        revalidatePath("/[locale]/support", "page");
    } catch (error) {
        logApiError("donations-revalidate", error);
    }
}
