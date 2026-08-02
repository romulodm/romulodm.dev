import * as Sentry from "@sentry/nextjs";

import { baseSentryOptions, sentryEnabled } from "@/lib/sentry";

if (sentryEnabled) {
  Sentry.init(baseSentryOptions);
}
