import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/money";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SalonPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_active", true)
    .maybeSingle();

  if (!salon) notFound();

  const [{ data: services }, { data: barbers }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("barbers")
      .select("id, display_name, bio, photo_url, specialties, is_active")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("display_name"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-sm uppercase tracking-[0.25em] text-gold">Salon</p>
      <h1 className="mt-2 font-serif text-5xl">{salon.name}</h1>
      <p className="mt-4 max-w-2xl text-muted">
        {[salon.address_line, salon.city, salon.state].filter(Boolean).join(", ") || "Address not published"}
      </p>
      {salon.description ? <p className="mt-4 max-w-3xl">{salon.description}</p> : null}
      <div className="mt-8">
        <Button asChild>
          <Link href={`/salons/${salon.slug}/book`}>Book an appointment</Link>
        </Button>
      </div>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Services</h2>
        {!services?.length ? (
          <div className="mt-6">
            <EmptyState title="No services yet" description="This salon has not published services." />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <li key={service.id} className="glass-panel rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl">{service.name}</h3>
                    <p className="mt-1 text-sm text-muted">{service.duration_minutes} minutes</p>
                  </div>
                  <p className="text-gold">{formatMoney(service.price_kobo, salon.currency)}</p>
                </div>
                {service.description ? <p className="mt-3 text-sm text-muted">{service.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Team</h2>
        {!barbers?.length ? (
          <div className="mt-6">
            <EmptyState title="No public team profiles" description="Staff profiles will appear after the owner adds them." />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {barbers.map((barber) => (
              <li key={barber.id} className="glass-panel rounded-2xl p-5">
                <h3 className="font-serif text-xl">{barber.display_name}</h3>
                {barber.bio ? <p className="mt-2 text-sm text-muted">{barber.bio}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
