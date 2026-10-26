import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/types/database";

export const getOptionalUser = cache(async () => {
  if (!isSupabaseConfigured()) return { supabase: null, user: null };
  return getSessionUser();
});

export const getSessionUser = cache(async () => {
  if (!isSupabaseConfigured()) return { supabase: null, user: null };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

export async function requireUser() {
  const ctx = await getSessionUser();
  if (!ctx.supabase || !ctx.user) redirect("/login");
  return { supabase: ctx.supabase, user: ctx.user };
}

export class SchemaMissingError extends Error {
  constructor() {
    super("SCHEMA_MISSING");
    this.name = "SchemaMissingError";
  }
}

export function isSchemaMissingError(error: unknown) {
  return (
    error instanceof SchemaMissingError ||
    (error instanceof Error && (error.name === "SchemaMissingError" || error.message === "SCHEMA_MISSING"))
  );
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message ?? "").toLowerCase().includes("could not find the table") ||
    (error.message ?? "").toLowerCase().includes("does not exist")
  );
}

export const getProfile = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (isMissingTable(error)) throw new SchemaMissingError();
  if (error && error.code !== "PGRST116") throw error;
  if (data) return { supabase, user, profile: data };

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? null,
    })
    .select("*")
    .single();
  if (isMissingTable(insertError)) throw new SchemaMissingError();
  if (insertError) throw insertError;
  return { supabase, user, profile: created };
});

export const getMemberships = cache(async () => {
  const { supabase, user, profile } = await getProfile();
  const { data, error } = await supabase
    .from("salon_memberships")
    .select("id, role, status, salon_id, salons(id, name, slug, is_active)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (isMissingTable(error)) throw new SchemaMissingError();
  if (error) throw error;
  return { supabase, user, profile, memberships: data ?? [] };
});

export async function requireSalonAccess(salonId: string, roles?: MembershipRole[]) {
  const ctx = await getMemberships();
  const membership = ctx.memberships.find((item) => item.salon_id === salonId);
  if (!membership) redirect("/app");
  if (roles && !roles.includes(membership.role as MembershipRole)) {
    redirect(`/app/salons/${salonId}`);
  }
  return { ...ctx, membership, role: membership.role as MembershipRole };
}
