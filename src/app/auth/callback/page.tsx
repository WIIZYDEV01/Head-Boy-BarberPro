"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [status, setStatus] = useState("Signing you in with Google…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const fail = (detail: string) => {
      const friendly =
        detail.toLowerCase().includes("unable to exchange external code") || detail.startsWith("4/")
          ? "Google and Supabase do not match. In Google Cloud, Authorized redirect URI must be exactly https://vsejrjarwtgqolqxladc.supabase.co/auth/v1/callback (remove any vercel.app redirect). Then paste that same client's ID and secret into Supabase → Authentication → Google and save."
          : detail;
      setStatus(friendly);
      router.replace(`/login?error=oauth&detail=${encodeURIComponent(friendly)}`);
    };

    const providerError = searchParams.get("error_description") || searchParams.get("error");
    if (providerError) {
      fail(providerError);
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      fail("Google did not send a login code.");
      return;
    }

    if (!isSupabaseConfigured()) {
      fail("Supabase keys are missing.");
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

    const timeout = window.setTimeout(() => {
      fail("Google sign-in timed out. Check your network and try once more.");
    }, 20000);

    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      window.clearTimeout(timeout);
      document.cookie = "oauth_next=; path=/; max-age=0; samesite=lax";
      if (error) {
        fail(error.message);
        return;
      }
      router.replace(destination);
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <p className="rounded-2xl border border-white/10 bg-black/70 px-8 py-6 text-sm text-muted">{status}</p>
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
