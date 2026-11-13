// lib/sentry-client.ts
// Browser-side Sentry, loaded on demand instead of before hydration.

import { baseSentryOptions, sentryEnabled } from "@/lib/sentry";

type SentryModule = typeof import("@sentry/nextjs");

/**
 * The browser SDK (~110KB compressed, with tracing) used to be imported by
 * instrumentation-client.ts, which Next runs before hydrating the app, so
 * every visitor parsed and ran it ahead of the page's own code. It is now a
 * separate chunk: instrumentation-client.ts asks for it once the page has
 * loaded and the main thread is idle, and an error boundary asks for it at
 * once if something breaks earlier. Errors thrown before that are kept by
 * instrumentation-client.ts and reported when the SDK arrives.
 *
 * Nothing in the client bundle may import "@sentry/nextjs" statically, or
 * the SDK goes back into the initial chunk. Server code is unaffected.
 */
let loading: Promise<SentryModule> | null = null;
let loaded: SentryModule | null = null;
const waiting: Array<(sentry: SentryModule) => void> = [];

export function loadSentry(): Promise<SentryModule> {
  loading ??= import("@sentry/nextjs").then((Sentry) => {
    if (sentryEnabled) {
      Sentry.init({
        ...baseSentryOptions,

        integrations: [Sentry.browserTracingIntegration()],

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

    loaded = Sentry;
    for (const run of waiting.splice(0)) run(Sentry);
    return Sentry;
  });
  return loading;
}

/** The SDK if it is already initialized; null before that. */
export function getLoadedSentry(): SentryModule | null {
  return loaded;
}

/**
 * Runs `fn` with the SDK as soon as it is initialized, without triggering
 * the load. For calls that can wait, such as tagging the signed-in user:
 * loading the SDK early just for that would undo the deferral.
 */
export function whenSentryLoaded(fn: (sentry: SentryModule) => void): void {
  if (loaded) fn(loaded);
  else waiting.push(fn);
}
