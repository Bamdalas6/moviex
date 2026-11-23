import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy: the browser only loads scripts, styles, images and
 * frames from the places this app really uses, so injected markup can't pull in
 * a script from elsewhere, post a form to another site, or frame us.
 * ('unsafe-inline' scripts are needed for Next.js's inline bootstrap; dev adds
 * eval and the hot-reload socket.)
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://image.tmdb.org https://i.ytimg.com https://upload.wikimedia.org https://thumb.wikimedia.org",
  "font-src 'self' data:",
  `connect-src 'self' https://cloudflareinsights.com${dev ? " ws: wss:" : ""}`,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Browsers only ever reach the site over HTTPS (two years, subdomains included).
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  // Pages opened from here (or that open us) can't reach into this window.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // libSQL ships native bindings for Node; keep it out of the server bundle there.
  // (On Cloudflare Workers the package resolves to its pure-JS HTTP client.)
  serverExternalPackages: ["@libsql/client", "libsql"],
  images: {
    // Serve images as-is: TMDB's CDN already delivers sized posters, uploads are capped
    // at 5 MB, and this keeps the app free of a paid image-resizing service on Cloudflare.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      // Actor photos from Wikimedia Commons (via Wikipedia) when TMDB has none.
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
    ],
  },
  experimental: {
    serverActions: {
      // Posters are uploaded through a Server Action (max 5 MB, see lib/constants.ts).
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
