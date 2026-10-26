import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSalonAccess } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatInTimeZone } from "@/lib/time";

export default async function PaymentsPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { data: salon } = await supabase.from("salons").select("currency, timezone").eq("id", salonId).single();
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(100);

  const received = (payments ?? [])
    .filter((row) => row.status === "success")
    .reduce((sum, row) => sum + row.amount_kobo, 0);

  return (
    <div>
      <h2 className="font-serif text-2xl">Payments</h2>
      <p className="mt-2 text-sm text-muted">
        Verified received total: {formatMoney(received, salon?.currency ?? "NGN")}. Pending checkouts are not counted.
      </p>
      {!payments?.length ? (
        <div className="mt-6">
          <EmptyState title="No payment records" description="Paystack transactions appear after a booking that requires online payment." />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {payments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm">
              <div>
                <p>{formatMoney(payment.amount_kobo, payment.currency)}</p>
                <p className="text-muted">
                  {payment.reference}
                  {payment.paid_at
                    ? ` · ${formatInTimeZone(new Date(payment.paid_at), salon?.timezone ?? "UTC")}`
                    : ""}
                </p>
              </div>
              <StatusBadge status={payment.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
