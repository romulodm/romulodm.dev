import * as Sentry from "@sentry/nextjs";

import { baseSentryOptions, sentryEnabled } from "@/lib/sentry";

if (sentryEnabled) {
  Sentry.init({
    ...baseSentryOptions,

    tracesSampler: (samplingContext) => {
      const name = samplingContext.name ?? "";

      if (name.includes("/api/status") || name.includes("/_next/") || name.includes("/api/health")) {
        return 0;
      }

      return baseSentryOptions.tracesSampleRate;
    },

    beforeSend(event) {
      const headers = event.request?.headers;

      if (headers) {
        delete headers.cookie;
        delete headers.authorization;
        delete headers.Authorization;
        delete headers["x-forwarded-for"];
      }

      return event;
    },
  });
}
