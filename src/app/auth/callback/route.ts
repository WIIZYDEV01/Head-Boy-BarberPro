import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? request.cookies.get("oauth_next")?.value ?? "/app";
  const next = nextParam.startsWith("/") ? nextParam : "/app";
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");

  function loginRedirect(detail: string) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", "oauth");
    login.searchParams.set("detail", detail.slice(0, 180));
    return NextResponse.redirect(login);
  }

  if (providerError) {
    return loginRedirect(providerError);
  }

  if (!code) {
    return loginRedirect("Google did not return a login code. Add this site in Supabase Redirect URLs.");
  }

  if (!isSupabaseConfigured()) {
    return loginRedirect("Supabase keys are missing on the server.");
  }

  const destination = new URL(next, origin);
  const response = NextResponse.redirect(destination);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginRedirect(error.message);
  }

  response.cookies.delete("oauth_next");
  return response;
}
