import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=640&q=55",
    alt: "Classic barbershop interior with chairs",
  },
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=640&q=55",
    alt: "Barber cutting hair",
  },
  {
    src: "https://images.unsplash.com/photo-1599351431202-1e0f013fd9b1?auto=format&fit=crop&w=640&q=55",
    alt: "Close fade in the chair",
  },
  {
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=640&q=55",
    alt: "Beard trim with clippers",
  },
];

export default async function HomePage() {
  const salons = isSupabaseConfigured() ? await loadPublishedSalons() : [];

  return (
    <div>
      <section className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-24">
        <p className="text-xs uppercase tracking-[0.45em] text-gold">Head Boy BarberPro</p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
          Precision cuts. Live chairs. Verified pay.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          Book a published salon, or run yours: services, team, hours, appointments, and Paystack — no dummy numbers.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/salons">Book a chair</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/app">Open dashboard</Link>
          </Button>
        </div>
      </section>

      <section id="services" className="mx-auto grid max-w-6xl gap-5 px-4 pb-20 md:grid-cols-3">
        {[
          {
            title: "Online booking",
            body: "Pick service, barber, and a live slot. Double-booking is blocked in the database, not just the calendar.",
          },
          {
            title: "Your profile",
            body: "Photo, name, phone, and cut notes — the client card Booksy and theCut put on every visit.",
          },
          {
            title: "Rebook & rate",
            body: "Upcoming vs history, book the same chair again, save a shop, and leave a star after the fade.",
          },
        ].map((item) => (
          <article key={item.title} className="glass-panel rounded-2xl p-7">
            <h2 className="font-serif text-2xl text-gold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section id="gallery" className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="font-serif text-3xl">The floor</h2>
        <p className="mt-2 text-sm text-muted">The look of a flagship shop. Your live salon data sits underneath.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map((shot) => (
            <div key={shot.src} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10">
              <Image src={shot.src} alt={shot.alt} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">Published salons</h2>
            <p className="mt-2 text-sm text-muted">Only shops owners chose to publish.</p>
          </div>
          <Link href="/salons" className="text-sm text-gold">
            View all
          </Link>
        </div>
        {salons.length === 0 ? (
          <p className="glass-panel mt-8 rounded-2xl px-6 py-12 text-sm text-muted">
            No salons are published yet. Open the dashboard, create a salon, then publish it from settings.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {salons.map((salon) => (
              <li key={salon.id} className="glass-panel rounded-2xl p-6">
                <h3 className="font-serif text-xl">{salon.name}</h3>
                <p className="mt-2 text-sm text-muted">{salon.city || "Location not listed"}</p>
                <Button asChild variant="outline" className="mt-5">
                  <Link href={`/salons/${salon.slug}`}>View salon</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function loadPublishedSalons() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("salons")
    .select("id, name, slug, city")
    .eq("is_published", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}
