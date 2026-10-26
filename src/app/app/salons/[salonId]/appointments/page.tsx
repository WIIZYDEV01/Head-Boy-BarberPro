import Link from "next/link";
import { staffSetAppointmentStatusForm } from "@/app/actions/appointments";
import type { AppointmentStatus } from "@/types/database";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSalonAccess } from "@/lib/auth/session";
import { formatInTimeZone } from "@/lib/time";

export default async function AppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ salonId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { salonId } = await params;
  const { status } = await searchParams;
  const { supabase, role } = await requireSalonAccess(salonId);
  const statuses: AppointmentStatus[] = [
    "pending_payment",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ];
  let query = supabase
    .from("appointments")
    .select("*, customers(full_name), barbers(display_name)")
    .eq("salon_id", salonId)
    .order("starts_at", { ascending: false })
    .limit(100);
  if (status && statuses.includes(status as AppointmentStatus)) {
    query = query.eq("status", status as AppointmentStatus);
  }
  const [{ data: salon }, { data: appointments }] = await Promise.all([
    supabase.from("salons").select("timezone").eq("id", salonId).single(),
    query,
  ]);

  return (
    <div>
      <h2 className="font-serif text-2xl">Appointments</h2>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["", "pending_payment", "confirmed", "completed", "cancelled", "no_show"].map((value) => (
          <Link
            key={value || "all"}
            href={value ? `?status=${value}` : "?"}
            prefetch
            className="rounded-full border border-border px-3 py-1 text-muted hover:text-gold"
          >
            {value || "all"}
          </Link>
        ))}
      </div>
      {!appointments?.length ? (
        <div className="mt-6">
          <EmptyState title="No appointments" description="Bookings will appear here after customers or staff create them." />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {appointments.map((appointment) => {
            const customer = Array.isArray(appointment.customers) ? appointment.customers[0] : appointment.customers;
            const barber = Array.isArray(appointment.barbers) ? appointment.barbers[0] : appointment.barbers;
            return (
              <li key={appointment.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{appointment.service_name_snapshot}</p>
                    <p className="text-sm text-muted">
                      {formatInTimeZone(new Date(appointment.starts_at), salon?.timezone ?? "UTC")} · {customer?.full_name} ·{" "}
                      {barber?.display_name}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["confirmed", "completed", "cancelled", "no_show"] as const).map((next) => (
                    <form key={next} action={staffSetAppointmentStatusForm.bind(null, salonId, appointment.id, next)}>
                      <Button type="submit" size="sm" variant="secondary">
                        Mark {next.replace("_", " ")}
                      </Button>
                    </form>
                  ))}
                </div>
                {role === "barber" ? (
                  <p className="mt-2 text-xs text-muted">Barbers can only change appointments assigned to them.</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
