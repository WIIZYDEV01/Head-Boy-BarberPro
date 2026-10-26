import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveSalonButton } from "@/components/profile/save-salon-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getOptionalUser, isMissingTable } from "@/lib/auth/session";
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

  const [{ data: services }, { data: barbers }, { data: reviews }, session] = await Promise.all([
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
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("salon_id", salon.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(8),
    getOptionalUser(),
  ]);

  let saved = false;
  if (session.user && session.supabase) {
    const savedRow = await session.supabase
      .from("saved_salons")
      .select("salon_id")
      .eq("user_id", session.user.id)
      .eq("salon_id", salon.id)
      .maybeSingle();
    saved = Boolean(savedRow.data) && !isMissingTable(savedRow.error);
  }

  const ratings = reviews ?? [];
  const average =
    ratings.length > 0 ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-sm uppercase tracking-[0.25em] text-gold">Salon</p>
      <h1 className="mt-2 font-serif text-5xl">{salon.name}</h1>
      <p className="mt-4 max-w-2xl text-muted">
        {[salon.address_line, salon.city, salon.state].filter(Boolean).join(", ") || "Address not published"}
      </p>
      {average ? (
        <p className="mt-3 text-sm text-gold">
          {average.toFixed(1)} ★ from {ratings.length} review{ratings.length === 1 ? "" : "s"}
        </p>
      ) : null}
      {salon.description ? <p className="mt-4 max-w-3xl">{salon.description}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/salons/${salon.slug}/book`}>Book an appointment</Link>
        </Button>
        {session.user ? (
          <SaveSalonButton salonId={salon.id} saved={saved} />
        ) : (
          <Button asChild variant="outline">
            <Link href={`/login?next=/salons/${salon.slug}`}>Sign in to save</Link>
          </Button>
        )}
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
                <Button asChild size="sm" className="mt-4">
                  <Link href={`/salons/${salon.slug}/book?serviceId=${service.id}`}>Book this</Link>
                </Button>
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
                {barber.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={barber.photo_url} alt="" className="mb-4 h-28 w-28 rounded-full object-cover" />
                ) : null}
                <h3 className="font-serif text-xl">{barber.display_name}</h3>
                {barber.bio ? <p className="mt-2 text-sm text-muted">{barber.bio}</p> : null}
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href={`/salons/${salon.slug}/book?barberId=${barber.id}`}>Book this barber</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16">
        <h2 className="font-serif text-3xl">Reviews</h2>
        {!ratings.length ? (
          <p className="mt-4 text-sm text-muted">No public ratings yet. After a completed visit, clients can rate from My bookings.</p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {ratings.map((review) => (
              <li key={review.id} className="glass-panel rounded-2xl p-5">
                <p className="text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                {review.comment ? <p className="mt-2 text-sm">{review.comment}</p> : <p className="mt-2 text-sm text-muted">Rated the visit.</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
