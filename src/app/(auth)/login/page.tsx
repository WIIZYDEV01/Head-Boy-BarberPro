import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordInput } from "@/components/auth/password-input";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; detail?: string }>;
}) {
  const { next, error, detail } = await searchParams;
  const destination = next || "/app";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="hidden flex-1 flex-col justify-end px-12 pb-16 pt-12 lg:flex">
        <p className="text-xs uppercase tracking-[0.45em] text-gold">Private access</p>
        <h1 className="mt-5 max-w-xl font-serif text-6xl leading-[1.05]">
          {BRAND_TAGLINE}
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-muted">
          {BRAND_NAME} is built like a high-end shop floor: live slots, staff, customers, and verified Paystack payments.
          Sign in to enter.
        </p>
      </section>
      <section className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8">
          <p className="font-serif text-3xl text-gold">{BRAND_NAME}</p>
          <h2 className="mt-2 text-lg font-medium">Sign in to continue</h2>
          <p className="mt-2 text-sm text-muted">
            Continue with Google, Discord, or email. First email sign-in creates the account.
          </p>
          {error === "oauth" ? (
            <p className="mt-4 text-sm text-red-300">
              {detail?.toLowerCase().includes("unable to exchange") ||
              detail?.toLowerCase().includes("google and supabase")
                ? "Google opened, but the Client secret in Supabase does not match Google Cloud. Open Supabase → Authentication → Google, paste the Client ID and Client secret from Head Boy BarberPro Web, Save, then try once more."
                : detail || "Google sign-in did not finish. Try once more, or use email below."}
            </p>
          ) : null}
          <div className="mt-8 space-y-6">
            <OAuthButtons next={destination} />
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted">
              <span className="h-px flex-1 bg-white/10" />
              email
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <ActionForm action={loginAction} submitLabel="Sign in" pendingLabel="Signing in…" submitClassName="w-full rounded-full">
              <input type="hidden" name="next" value={destination} />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput />
              </div>
            </ActionForm>
            <p className="text-center text-sm text-muted">
              <Link href="/forgot-password" className="hover:text-gold">
                Forgot password
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
