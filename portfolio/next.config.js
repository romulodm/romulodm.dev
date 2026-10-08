const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

/** @type {import('next').NextConfig} */

const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Hosts allowed to reach the dev server cross-origin (Next 16 blocks the
// rest). Covers the Tailscale IP range/MagicDNS names used to test from the
// phone; extra hosts can be added via NEXT_DEV_ORIGINS (comma-separated).
const allowedDevOrigins = [
  "100.64.123.87",
  "*.ts.net",
  ...(process.env.NEXT_DEV_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

// Post media is referenced by relative `/media/<key>` paths (lib/media.ts),
// which this rewrite maps onto the MinIO bucket. Two consumers depend on it:
//
//   - `next dev`, where nothing else sits in front of the app;
//   - the image optimizer, in every environment. `/_next/image?url=/media/...`
//     fetches the source through Next's own router, never through nginx, so
//     even in production (where nginx answers browser requests for /media/
//     itself) the optimizer needs this route to reach the bucket.
//
// The origin is MinIO's address as seen by the Next.js server, built from the
// same server-only MINIO_ENDPOINT/MINIO_PORT the S3 client uses (lib/s3.ts).
// Rewrites are frozen at build time and `docker build` gets no .env (see
// .dockerignore), so a production build without those variables falls back to
// the `minio` service on the compose network instead of localhost.
function mediaOrigin() {
  const host = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT || "9000";
  const scheme = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  if (host) return `${scheme}://${host}:${port}`;
  return process.env.NODE_ENV === "production" ? "http://minio:9000" : "http://localhost:9000";
}

const MEDIA_BUCKET = process.env.MINIO_BUCKET_NAME || "portfolio-blog";

const nextConfig = {
  output: 'standalone',
  allowedDevOrigins,
  typescript: {
    tsconfigPath: 'tsconfig.build.json',
  },
  outputFileTracingIncludes: {
    '/[locale]/legal/**': ['./content/legal/**'],
  },
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  transpilePackages: ["game", "phaser", "centrifuge"],
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${mediaOrigin()}/${MEDIA_BUCKET}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/game/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    // Post media is a local path (`/media/...`), so it needs no remote
    // pattern: the optimizer fetches it through the rewrite above. No
    // `localPatterns` either: left unset, Next allows every local path, while
    // listing only /media/** would block the images under /public.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: "/**",
      },
    ],
  },
};


const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,
  telemetry: false,

  sourcemaps: {
    // Uploads source maps and deletes them from the served bundle — users don't
    // download the original code, but stack traces in Sentry stay readable.
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },

  // Proxies SDK requests through our own domain: ad blockers commonly block
  // direct calls to ingest.sentry.io.
  tunnelRoute: "/monitoring",

  // Webpack options — ignored under Turbopack (Next 16 default), kept in case
  // the build ever falls back to webpack. Root-level `disableLogger` and
  // `automaticVercelMonitors` have been deprecated since SDK 10.x and kept
  // warning in dev.
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
};

module.exports = withSentryConfig(withNextIntl(nextConfig), sentryBuildOptions);