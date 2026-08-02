// Sentry initialization in the browser. Next loads this file before
// hydrating the app, so boot errors are captured as well.

import * as Sentry from "@sentry/nextjs";

import { baseSentryOptions, sentryEnabled } from "@/lib/sentry";

if (sentryEnabled) {
  Sentry.init({
    ...baseSentryOptions,

    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // We don't use Session Replay (extra bundle size and we don't want session recording).
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,

    // Noise from browser extensions: stack traces that don't come from our domain.
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });
}

/** Instruments App Router navigations (client-side transitions). */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
