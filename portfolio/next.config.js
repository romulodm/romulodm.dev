const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

/** @type {import('next').NextConfig} */

const createNextIntlPlugin = require("next-intl/plugin");
const { withSentryConfig } = require("@sentry/nextjs");
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/[locale]/legal/**': ['./content/legal/**'],
  },
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  transpilePackages: ["game", "phaser", "centrifuge"],
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
    remotePatterns: [
      {
        protocol: process.env.MINIO_USE_SSL === "true" ? "https" : "http",
        hostname: process.env.MINIO_ENDPOINT || "localhost",
        port: process.env.MINIO_PORT || "9000",
        pathname: "/**",
      },
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