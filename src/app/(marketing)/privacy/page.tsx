export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">Privacy policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>
          Head Boy BarberPro stores account, salon, customer, appointment, and payment metadata needed to operate the
          service. Payment card numbers are never collected or stored here; Paystack processes card data.
        </p>
        <p>
          Salon owners are responsible for the personal data they enter about customers and staff. You can anonymize
          customer records from the salon dashboard when your role allows it.
        </p>
        <p>
          Authentication is provided by Supabase Auth, including Google and Discord sign-in. Session cookies are required to
          keep you signed in.
        </p>
      </div>
    </div>
  );
}
