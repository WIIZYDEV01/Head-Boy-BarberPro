import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublic } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  const { url, anonKey } = requireSupabasePublic();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component; session refresh happens in proxy.
        }
      },
    },
  });
}
