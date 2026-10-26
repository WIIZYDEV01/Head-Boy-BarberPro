import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getMemberships, isMissingTable } from "@/lib/auth/session";
import { formatInTimeZone } from "@/lib/time";

export default async function AppHomePage() {
  const { profile, memberships, supabase, user } = await getMemberships();
  const nowIso = new Date().toISOString();
  const [{ data: nextRows }, savedResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, status, service_name_snapshot, salons(name, timezone, slug)")
      .eq("customer_user_id", user.id)
      .in("status", ["confirmed", "pending_payment"])
      .gte("starts_at", nowIso)
      .order("starts_at")
      .limit(1),
    supabase
      .from("saved_salons")
      .select("salon_id, salons(name, slug, city, logo_url)")
      .eq("user_id", user.id),
  ]);
  const savedShops = isMissingTable(savedResult.error) ? [] : (savedResult.data ?? []);
  const nextVisit = nextRows?.[0];
  const nextSalon = (
    nextVisit
      ? Array.isArray(nextVisit.salons)
        ? nextVisit.salons[0]
        : nextVisit.salons
      : null
  ) as { name?: string; timezone?: string; slug?: string } | null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Live floor</p>
          <h1 className="mt-2 font-serif text-4xl">
            Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your next chair, saved shops, and salons you run — nothing here is dummy data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/salons">Book a chair</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/profile">Edit profile</Link>
          </Button>
        </div>
      </div>

      {nextVisit ? (
        <section className="glass-panel overflow-hidden rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Next visit</p>
          <h2 className="mt-2 font-serif text-3xl">{nextVisit.service_name_snapshot}</h2>
          <p className="mt-2 text-muted">
            {nextSalon?.name} · {formatInTimeZone(new Date(nextVisit.starts_at), nextSalon?.timezone ?? "UTC")}
          </p>
          <div className="mt-4">
            <StatusBadge status={nextVisit.status} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/app/bookings">Manage booking</Link>
            </Button>
            {nextSalon?.slug ? (
              <Button asChild variant="outline">
                <Link href={`/salons/${nextSalon.slug}`}>Open shop</Link>
              </Button>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="glass-panel rounded-3xl p-8">
          <h2 className="font-serif text-2xl">No chair on the books</h2>
          <p className="mt-2 text-sm text-muted">Pick a published salon, choose a service, and lock a live slot.</p>
          <Button asChild className="mt-5">
            <Link href="/salons">Browse salons</Link>
          </Button>
        </section>
      )}

      {savedShops.length ? (
        <section>
          <h2 className="font-serif text-2xl">Saved shops</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {savedShops.map((row) => {
              const salon = (
                Array.isArray(row.salons) ? row.salons[0] : row.salons
              ) as { name?: string; slug?: string; city?: string } | null;
              return (
                <li key={row.salon_id} className="glass-panel rounded-2xl p-5">
                  <p className="font-serif text-xl">{salon?.name ?? "Salon"}</p>
                  <p className="mt-1 text-sm text-muted">{salon?.city || "City not listed"}</p>
                  {salon?.slug ? (
                    <Button asChild size="sm" className="mt-4">
                      <Link href={`/salons/${salon.slug}/book`}>Book again</Link>
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-2xl">Your salons</h2>
        {!memberships.length ? (
          <div className="mt-4">
            <EmptyState
              title="No salon memberships yet"
              description="Create a salon to manage staff and appointments, or book a published salon as a customer."
              action={
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/app/salons/new">Create a salon</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/salons">Find a salon</Link>
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {memberships.map((membership) => {
              const salon = Array.isArray(membership.salons) ? membership.salons[0] : membership.salons;
              return (
                <Card key={membership.id}>
                  <CardHeader>
                    <CardTitle>{salon?.name ?? "Salon"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted">Your role: {membership.role}</p>
                    <Button asChild>
                      <Link href={`/app/salons/${membership.salon_id}`}>Open salon</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
