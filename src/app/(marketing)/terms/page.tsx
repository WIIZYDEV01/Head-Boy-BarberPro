export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">Terms of use</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>
          Head Boy BarberPro is provided for managing real barbing salon operations. You must only access salons you own or have
          been invited to. Attempting to access another salon&apos;s private records is prohibited.
        </p>
        <p>
          Appointments and payments recorded in the system are the source of truth for the product. Revenue figures are
          calculated from verified successful payments, not from pending checkouts.
        </p>
      </div>
    </div>
  );
}
