"use client";

import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function OAuthButtons({ next = "/app" }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "discord" | null>(null);

  async function continueWith(provider: "google" | "discord") {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured, so social sign-in cannot start.");
      return;
    }
    setPending(provider);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = window.location.origin;
      document.cookie = `oauth_next=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
          scopes: provider === "discord" ? "identify email" : undefined,
        },
      });
      if (oauthError) {
        setError(
          oauthError.message.includes("Unsupported provider") ||
            oauthError.message.toLowerCase().includes("provider is not enabled")
            ? `Turn on ${provider === "google" ? "Google" : "Discord"} in Supabase → Authentication → Providers.`
            : oauthError.message,
        );
        setPending(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Social sign-in failed");
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => continueWith("google")}
        disabled={pending !== null}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white text-sm font-semibold text-black transition hover:bg-zinc-100 disabled:opacity-60"
      >
        <GoogleMark />
        {pending === "google" ? "Opening Google…" : "Continue with Google"}
      </button>
      <button
        type="button"
        onClick={() => continueWith("discord")}
        disabled={pending !== null}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#5865F2] text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:opacity-60"
      >
        <DiscordMark />
        {pending === "discord" ? "Opening Discord…" : "Continue with Discord"}
      </button>
      {error ? <p className="text-center text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.4l6.3 5.2C38.8 37.3 44 31.3 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.6 3l-.2.4c1.8.5 3.4 1.3 5 2.3-2.1-1-4.4-1.7-6.8-2-.6-.1-1.2-.1-1.8-.1s-1.2 0-1.8.1c-2.4.3-4.7 1-6.8 2 1.6-1 3.2-1.8 5-2.3L8.4 3A19.8 19.8 0 0 0 3.7 4.4C1.3 8.1.2 11.6.5 15.1c2 1.5 4 2.6 6.1 3.3l.8-1.3c-.8-.3-1.6-.7-2.3-1.2.2.1 3.2 1.8 8.9 1.8s8.7-1.7 8.9-1.8c-.7.5-1.5.9-2.3 1.2l.8 1.3c2.1-.7 4.1-1.8 6.1-3.3.4-4-.7-7.5-3.2-10.7zM8.3 13.6c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.7.8 1.6 1.8-.7 1.8-1.6 1.8zm7.4 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.7.8 1.6 1.8-.7 1.8-1.6 1.8z" />
    </svg>
  );
}
