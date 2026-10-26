import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Authenticated salon dashboards, bookings, and payments are request-time.
  // Cache Components / PPR is left off so cookies and session checks are not
  // blocked by prerender rules.
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
