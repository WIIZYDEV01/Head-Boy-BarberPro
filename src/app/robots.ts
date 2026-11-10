import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/salons", "/contact", "/privacy", "/terms", "/login", "/llms.txt"],
        disallow: ["/app/", "/onboarding", "/auth/", "/api/", "/payments/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
