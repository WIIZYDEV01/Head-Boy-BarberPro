export function SchemaMissing() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm uppercase tracking-[0.25em] text-gold">Setup required</p>
      <h1 className="mt-3 font-serif text-4xl">Create the Head Boy BarberPro tables in Supabase</h1>
      <p className="mt-4 text-sm text-muted">
        Sign-in worked. The dashboard crashed because this Supabase project has no <code>profiles</code> table yet. You
        do need to create the tables — run the SQL files that already ship with the app. Do not create tables by hand.
      </p>
      <ol className="mt-8 list-decimal space-y-3 pl-5 text-sm leading-7">
        <li>Open your Supabase project.</li>
        <li>Left sidebar → <strong>SQL Editor</strong> → <strong>New query</strong>.</li>
        <li>
          Open <code>supabase/migrations/0001_init.sql</code> in this project, copy everything, paste it into the editor,
          click <strong>Run</strong>.
        </li>
        <li>
          Repeat for <code>supabase/migrations/0002_public_busy_ranges.sql</code>.
        </li>
        <li>
          Repeat for <code>supabase/migrations/0003_payments_customer_insert.sql</code>.
        </li>
        <li>Refresh this page.</li>
      </ol>
    </div>
  );
}
