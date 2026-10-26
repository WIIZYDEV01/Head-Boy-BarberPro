import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireSalonAccess } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatInTimeZone } from "@/lib/time";
import { canViewRevenue } from "@/lib/permissions";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default async function SalonDashboardPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const { supabase, role } = await requireSalonAccess(salonId);
  const showRevenue = canViewRevenue(role);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const from = new Date();
  from.setDate(from.getDate() - 13);
  from.setHours(0, 0, 0, 0);

  const [{ data: salon }, { data: today }, paymentsResult] = await Promise.all([
    supabase.from("salons").select("*").eq("id", salonId).single(),
    supabase
      .from("appointments")
      .select("id, starts_at, status, service_name_snapshot, customers(full_name)")
      .eq("salon_id", salonId)
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .order("starts_at"),
    showRevenue
      ? supabase
          .from("payments")
          .select("amount_kobo, paid_at, status")
          .eq("salon_id", salonId)
          .eq("status", "success")
          .gte("paid_at", from.toISOString())
      : Promise.resolve({ data: [] as { amount_kobo: number; paid_at: string | null; status: string }[] }),
  ]);
  if (!salon) return null;

  const counts = {
    today: today?.length ?? 0,
    confirmed: today?.filter((row) => row.status === "confirmed").length ?? 0,
    completed: today?.filter((row) => row.status === "completed").length ?? 0,
    cancelled: today?.filter((row) => row.status === "cancelled").length ?? 0,
  };

  let revenueKobo = 0;
  let chart: { date: string; amount: number }[] = [];
  if (showRevenue) {
    const payments = paymentsResult.data ?? [];
    revenueKobo = payments.reduce((sum, row) => sum + row.amount_kobo, 0);
    const byDay = new Map<string, number>();
    for (let i = 0; i < 14; i += 1) {
      const day = new Date(from);
      day.setDate(from.getDate() + i);
      byDay.set(day.toISOString().slice(0, 10), 0);
    }
    for (const payment of payments ?? []) {
      if (!payment.paid_at) continue;
      const key = payment.paid_at.slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + payment.amount_kobo);
    }
    chart = [...byDay.entries()].map(([date, amount]) => ({ date, amount }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Today" value={String(counts.today)} />
        <Metric title="Confirmed today" value={String(counts.confirmed)} />
        <Metric title="Completed today" value={String(counts.completed)} />
        <Metric
          title="Verified revenue (14d)"
          value={canViewRevenue(role) ? formatMoney(revenueKobo, salon.currency) : "Hidden"}
        />
      </div>
      {canViewRevenue(role) ? (
        chart.every((point) => point.amount === 0) ? (
          <EmptyState
            title="No verified payments in this period"
            description="Charts stay at zero until Paystack verification records a successful payment."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Verified payments</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={chart} currency={salon.currency} />
            </CardContent>
          </Card>
        )
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {!today?.length ? (
            <p className="text-sm text-muted">No appointments start today.</p>
          ) : (
            <ul className="space-y-3">
              {today.map((row) => {
                const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
                return (
                  <li key={row.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>
                      {formatInTimeZone(new Date(row.starts_at), salon.timezone)} · {row.service_name_snapshot} ·{" "}
                      {customer?.full_name}
                    </span>
                    <StatusBadge status={row.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent className="font-serif text-3xl">{value}</CardContent>
    </Card>
  );
}
