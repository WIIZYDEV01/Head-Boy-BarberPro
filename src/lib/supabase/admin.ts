import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabasePublic } from "@/lib/env";
import type { Database } from "@/types/database";

export function createServiceRoleClient() {
  const { url } = requireSupabasePublic();
  return createClient<Database>(url, requireServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
