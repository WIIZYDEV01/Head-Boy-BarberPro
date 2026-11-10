import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function day(value?: string | Date) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastmod = day();
  const routes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: lastmod, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/salons`, lastModified: lastmod, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/login`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.4 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return routes;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: salons } = await supabase
      .from("salons")
      .select("slug, updated_at")
      .eq("is_published", true)
      .eq("is_active", true);

    for (const salon of salons ?? []) {
      routes.push({
        url: `${SITE_URL}/salons/${salon.slug}`,
        lastModified: day(salon.updated_at),
        changeFrequency: "daily",
        priority: 0.8,
      });
      routes.push({
        url: `${SITE_URL}/salons/${salon.slug}/book`,
        lastModified: lastmod,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  } catch {
    // Always return a valid sitemap even if the directory query fails.
  }

  return routes;
}
