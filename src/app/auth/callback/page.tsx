"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Signing you in with Google…");

  useEffect(() => {
    const providerError = searchParams.get("error_description") || searchParams.get("error");
    if (providerError) {
      router.replace(`/login?error=oauth&detail=${encodeURIComponent(providerError)}`);
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      router.replace("/login?error=oauth&detail=Google did not send a login code.");
      return;
    }

    if (!isSupabaseConfigured()) {
      router.replace("/login?error=oauth&detail=Supabase keys are missing.");
      return;
    }

    const nextCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("oauth_next="))
      ?.split("=")[1];
    const next = decodeURIComponent(nextCookie || "/app");
    const destination = next.startsWith("/") ? next : "/app";

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { detectSessionInUrl: false, flowType: "pkce" } },
    );

    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      document.cookie = "oauth_next=; path=/; max-age=0; samesite=lax";
      if (error) {
        setStatus(error.message);
        router.replace(`/login?error=oauth&detail=${encodeURIComponent(error.message)}`);
        return;
      }
      router.replace(destination);
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <p className="glass-panel rounded-2xl px-8 py-6 text-sm text-muted">{status}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <p className="text-sm text-gold">Signing you in…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
