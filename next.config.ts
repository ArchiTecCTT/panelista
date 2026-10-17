import type { NextConfig } from "next";

// Firebase Auth handler is proxied through our own origin so the Google
// sign-in screen says "panelista.vercel.app" and works without third-party
// cookies (Safari, Chrome 3PC phase-out).
const FIREBASE_AUTH_HOST = process.env.FIREBASE_AUTH_HOST ?? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`;

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Firebase signInWithPopup needs to talk to its popup window.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      // Not on /__/auth/*: Firebase frames /__/auth/iframe on our own origin to
      // deliver the sign-in result, and DENY would block it.
      { source: "/((?!__/).*)", headers: securityHeaders },
      { source: "/__/:path*", headers: [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] },
      // API responses are per-user JSON: never cache at the edge.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  async rewrites() {
    return [{ source: "/__/auth/:path*", destination: `https://${FIREBASE_AUTH_HOST}/__/auth/:path*` }];
  },
};

export default nextConfig;
