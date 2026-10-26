# Head Boy BarberPro setup

Head Boy BarberPro is a multi-salon barbing management app. It does not ship fake customers, appointments, or revenue. Empty dashboards are expected until you create real records.

## 1. App environment

Copy `.env.example` to `.env.local` and fill in real values from your dashboards.

| Variable | Where it comes from | Browser-safe? |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally, your Vercel URL in production | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | **No. Server only.** |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack → Settings → API Keys & Webhooks | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_...` in sandbox) | **No. Server only.** |
| `PAYSTACK_WEBHOOK_SECRET` | Optional. If empty, the secret key is used for HMAC verification | **No.** |

Never commit `.env.local`. Never prefix the service role or Paystack secret with `NEXT_PUBLIC_`.

## 2. Supabase

1. Create a project.
2. Run the SQL files in `supabase/migrations/` in order in the SQL editor (or with the Supabase CLI):
   - `0001_init.sql`
   - `0002_public_busy_ranges.sql`
   - `0003_payments_customer_insert.sql`
3. Authentication → Providers:
   - Enable **Email**. For local testing, turn **Confirm email** off so the first email/password sign-in creates a session immediately.
   - Enable **Google** and **Discord**. The app has no separate registration page; email/password sign-in creates the account on first success.
4. Authentication → URL configuration:
   - Site URL local: `http://localhost:3000`
   - Site URL production: `https://YOUR_DOMAIN`
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://YOUR_DOMAIN/auth/callback`
5. Google Cloud Console:
   - Create an OAuth 2.0 Client ID (Web application).
   - Authorized JavaScript origins: `http://localhost:3000` and your production origin.
   - Authorized redirect URI (this is the **Supabase** callback, not `/login`):
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Paste the Client ID and Client Secret into Supabase → Authentication → Providers → Google.
6. Discord Developer Portal:
   - Create an application → OAuth2.
   - Redirects: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Scopes: `identify` and `email`.
   - Paste the Client ID and Client Secret into Supabase → Authentication → Providers → Discord.
7. Platform admin: in SQL, set `profiles.is_platform_admin = true` for your user. The app blocks ordinary users from flipping that flag.

Storage bucket `salon-assets` is created by the first migration.

## 3. Paystack

Sandbox (`pk_test_` / `sk_test_`) and live (`pk_live_` / `sk_live_`) use the same code path. Only the keys change.

Webhook URL:

- Local: use a tunnel to `http://localhost:3000/api/webhooks/paystack`
- Production: `https://YOUR_DOMAIN/api/webhooks/paystack`

Paystack signs webhooks with HMAC SHA512 using your secret key. The handler ignores unsigned bodies. Successful charges are applied only after `transaction/verify` matches the stored amount, currency, and reference. Repeated webhooks for an already-successful payment are ignored.

A browser redirect to `/payments/callback` also verifies with Paystack. It is not treated as proof of payment by itself.

## 4. Local run

```bash
npm install
npm run dev
```

Then register, create a salon, add services, publish the salon, and book as a customer.

## 5. Vercel

1. Import the Git repository.
2. Set the same environment variables.
3. Production `NEXT_PUBLIC_APP_URL` must match the deployed domain.
4. Add the production auth callback URLs in Supabase and Google.
5. Point Paystack webhooks at the production `/api/webhooks/paystack` route.

## 6. What is not claimed as tested without credentials

These integrations are implemented but cannot be fully verified in this repository without your live project keys:

- Email confirmation delivery
- Google OAuth consent screen
- Paystack checkout, verification, and webhooks
- Supabase RLS against a live database

Automated tests cover money math, slot generation, appointment transitions, tenant helpers, and webhook signature checking.
