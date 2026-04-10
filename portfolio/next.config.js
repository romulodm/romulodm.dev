const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

/** @type {import('next').NextConfig} */

const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  output: 'standalone',
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
    ],
  },
};

module.exports = withNextIntl(nextConfig);
