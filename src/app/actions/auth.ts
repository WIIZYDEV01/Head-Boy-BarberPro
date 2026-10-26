"use server";

import { redirect } from "next/navigation";
import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, updatePasswordSchema } from "@/lib/validations";

export type ActionState = { error?: string; success?: string } | null;

function configured(): ActionState | null {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }
  return null;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const missing = configured();
  if (missing) return missing;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createServerSupabaseClient();
  const email = parsed.data.email;
  const password = parsed.data.password;
  const next = String(formData.get("next") || "/app");
  const destination = next.startsWith("/") ? next : "/app";

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError) redirect(destination);

  const signInMessage = signInError.message.toLowerCase();
  const unknownAccount =
    signInMessage.includes("invalid login") ||
    signInMessage.includes("invalid credentials") ||
    signInMessage.includes("user not found");

  if (!unknownAccount) {
    if (signInMessage.includes("confirm") || signInMessage.includes("not confirmed")) {
      return { error: "Confirm your email from the link Supabase sent, then try signing in again." };
    }
    return { error: signInError.message };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: email.split("@")[0] },
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (signUpError) {
    const created = signUpError.message.toLowerCase();
    if (created.includes("already") || created.includes("registered")) {
      return { error: "Wrong password for this email." };
    }
    return { error: signUpError.message };
  }

  if (signUpData.session) redirect(destination);

  return {
    success:
      "Account created. Confirm the email Supabase sent, then sign in. You can turn off Confirm email in Authentication → Providers → Email for local testing.",
  };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const missing = configured();
  if (missing) return missing;
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/update-password`,
  });
  if (error) return { error: error.message };
  return { success: "If an account exists for that email, a reset link has been sent." };
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };
  redirect("/app");
}
