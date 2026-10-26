import Link from "next/link";
import { customerCancelAppointmentForm } from "@/app/actions/appointments";
import { ReviewForm } from "@/components/profile/review-form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const appointmentIds = (appointments ?? []).map((row) => row.id);
  const { data: reviews } = appointmentIds.length
    ? await supabase.from("reviews").select("appointment_id").in("appointment_id", appointmentIds)
    : { data: [] as { appointment_id: string }[] };

  const reviewed = new Set((reviews ?? []).map((row) => row.appointment_id));
  const now = Date.now();
  const list = appointments ?? [];
  const upcoming = list.filter(
    (item) =>
      new Date(item.starts_at).getTime() >= now &&
      (item.status === "confirmed" || item.status === "pending_payment"),
  );
  const past = list.filter((item) => !upcoming.includes(item));

  return (
    <div>
      <h1 className="font-serif text-4xl">My bookings</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Upcoming chairs, visit history, rebook, and ratings — the same loop Booksy and StyleSeat use after a cut.
      </p>
      {booked ? (
        <p className="mt-3 text-sm text-emerald-300">Booking saved. If payment was required, complete Paystack checkout.</p>
      ) : null}
      {!list.length ? (
        <div className="mt-8">
          <EmptyState
            title="No bookings yet"
            description="Find a published salon, pick a service, and the live appointment appears here."
            action={
              <Button asChild>
                <Link href="/salons">Find a salon</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <Tabs defaultValue={upcoming.length ? "upcoming" : "past"} className="mt-8">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">History ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            {!upcoming.length ? (
              <EmptyState title="No upcoming visits" description="Book a chair to see it here." />
            ) : (
              <BookingList items={upcoming as never} reviewed={reviewed} />
            )}
          </TabsContent>
          <TabsContent value="past">
            {!past.length ? (
              <EmptyState title="No visit history yet" description="Completed and cancelled visits land here." />
            ) : (
              <BookingList items={past as never} reviewed={reviewed} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function BookingList({
  items,
  reviewed,
}: {
  items: {
    id: string;
    status: string;
    starts_at: string;
    service_name_snapshot: string;
    price_kobo: number;
    currency: string;
    service_id: string | null;
    barber_id: string;
    salons: unknown;
  }[];
  reviewed: Set<string>;
}) {
  return (
    <ul className="space-y-4">
      {items.map((appointment) => {
        const salon = (
          Array.isArray(appointment.salons) ? appointment.salons[0] : appointment.salons
        ) as { name?: string; timezone?: string; currency?: string; slug?: string } | null;
        const bookAgain =
          salon?.slug && appointment.service_id
            ? `/salons/${salon.slug}/book?serviceId=${appointment.service_id}&barberId=${appointment.barber_id}`
            : salon?.slug
              ? `/salons/${salon.slug}/book`
              : "/salons";
        return (
          <li key={appointment.id} className="glass-panel rounded-2xl p-5">
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
            <div className="mt-4 flex flex-wrap gap-2">
              {appointment.status === "confirmed" || appointment.status === "pending_payment" ? (
                <form action={customerCancelAppointmentForm.bind(null, appointment.id)}>
                  <Button type="submit" variant="secondary" size="sm">
                    Cancel booking
                  </Button>
                </form>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href={bookAgain}>Book again</Link>
              </Button>
            </div>
            {appointment.status === "completed" && !reviewed.has(appointment.id) ? (
              <div className="mt-5 border-t border-white/10 pt-4">
                <ReviewForm appointmentId={appointment.id} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
