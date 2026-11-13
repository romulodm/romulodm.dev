// Sentry in the browser. Next runs this file before hydrating the app; it
// only schedules the SDK (see lib/sentry-client.ts) and keeps any error thrown
// in the meantime, so boot errors are still reported.

import { sentryEnabled } from "@/lib/sentry";
import { getLoadedSentry, loadSentry } from "@/lib/sentry-client";

const early: Array<ErrorEvent | PromiseRejectionEvent> = [];
const keep = (event: ErrorEvent | PromiseRejectionEvent) => {
  early.push(event);
};

function start() {
  loadSentry()
    .then((Sentry) => {
      // From here on the SDK's own global handlers take over.
      window.removeEventListener("error", keep);
      window.removeEventListener("unhandledrejection", keep);

      for (const event of early.splice(0)) {
        if ("reason" in event) {
          Sentry.captureException(event.reason);
        } else if (event.error) {
          Sentry.captureException(event.error);
        } else if (event.message && event.message !== "Script error.") {
          // "Script error." is a cross-origin error with no detail to report.
          Sentry.captureException(new Error(event.message));
        }
      }
    })
    // A blocked chunk (offline, extensions) must not become an error itself.
    .catch(() => {});
}

if (sentryEnabled) {
  window.addEventListener("error", keep);
  window.addEventListener("unhandledrejection", keep);

  // Same rule as the desktop lanyard (components/sections/hero/Hero.tsx):
  // after the load event, on the first idle moment, at most 3s later.
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      window.setTimeout(start, 200);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

/**
 * Instruments App Router navigations (client-side transitions). Navigations
 * before the SDK has loaded are not traced; the page load itself still is,
 * from the browser's performance timeline.
 */
export function onRouterTransitionStart(href: string, navigationType: string) {
  getLoadedSentry()?.captureRouterTransitionStart(href, navigationType);
}
