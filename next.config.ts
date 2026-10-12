import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Cloudflare R2 public bucket that serves session videos / clips.
const R2_HOST = "pub-ec6efd6486724c999de33694e15dd4dc.r2.dev";

// ── Content Security Policy ──────────────────────────────────────────────────
// NOTE: 'unsafe-inline' and 'unsafe-eval' are required by the embedded Sanity
// Studio (/studio) and Next.js' inline runtime/styles. A stricter nonce-based
// policy is tracked as a follow-up (see PENDING ITEMS in the audit notes) — it
// requires forcing dynamic rendering on every route, which would break the
// current static pages and the Studio.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: https://cdn.sanity.io https://images.unsplash.com https://drive.google.com https://lh3.googleusercontent.com https://primary.jwwb.nl https://img.youtube.com https://i.ytimg.com`,
  `media-src 'self' blob: https://${R2_HOST}`,
  `connect-src 'self' https://*.sanity.io https://*.api.sanity.io https://*.apicdn.sanity.io https://api.open-meteo.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://${R2_HOST}`,
  `frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com https://youtube.com`,
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework version to attackers.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "primary.jwwb.nl",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
