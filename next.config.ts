import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
