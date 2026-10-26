"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublic } from "@/lib/env";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = requireSupabasePublic();
  return createBrowserClient<Database>(url, anonKey);
}
