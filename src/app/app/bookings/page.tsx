import { customerCancelAppointmentForm } from "@/app/actions/appointments";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatInTimeZone } from "@/lib/time";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const { booked } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, salons(name, timezone, currency, slug)")
    .eq("customer_user_id", user.id)
    .order("starts_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-4xl">My bookings</h1>
      {booked ? (
        <p className="mt-3 text-sm text-emerald-300">Booking saved. If payment was required, complete Paystack checkout.</p>
      ) : null}
      {!appointments?.length ? (
        <div className="mt-8">
          <EmptyState title="No bookings yet" description="When you book a published salon, the confirmed database record appears here." />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {appointments.map((appointment) => {
            const salon = Array.isArray(appointment.salons) ? appointment.salons[0] : appointment.salons;
            return (
              <li key={appointment.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl">{appointment.service_name_snapshot}</p>
                    <p className="text-sm text-muted">
                      {salon?.name} · {formatInTimeZone(new Date(appointment.starts_at), salon?.timezone ?? "UTC")}
                    </p>
                    <p className="mt-1 text-sm">{formatMoney(appointment.price_kobo, appointment.currency)}</p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                {appointment.status === "confirmed" || appointment.status === "pending_payment" ? (
                  <form action={customerCancelAppointmentForm.bind(null, appointment.id)} className="mt-4">
                    <Button type="submit" variant="secondary" size="sm">
                      Cancel booking
                    </Button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
