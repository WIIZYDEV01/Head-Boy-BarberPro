import type { MetadataRoute } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { SITE_URL } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/salons`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  if (!isSupabaseConfigured()) return routes;

  const supabase = await createServerSupabaseClient();
  const { data: salons } = await supabase
    .from("salons")
    .select("slug, updated_at")
    .eq("is_published", true)
    .eq("is_active", true);

  for (const salon of salons ?? []) {
    routes.push({
      url: `${SITE_URL}/salons/${salon.slug}`,
      lastModified: salon.updated_at ? new Date(salon.updated_at) : now,
      changeFrequency: "daily",
      priority: 0.8,
    });
    routes.push({
      url: `${SITE_URL}/salons/${salon.slug}/book`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return routes;
}
