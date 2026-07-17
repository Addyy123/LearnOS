import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  // Allow the dev server to be accessed from local network IP addresses.
  // Without this, HMR (hot reload), Server Actions, and other dev resources
  // are blocked when accessed via IP instead of localhost.
  allowedDevOrigins: [
    "192.168.0.106",
  ],
};

export default withSerwist(nextConfig);
