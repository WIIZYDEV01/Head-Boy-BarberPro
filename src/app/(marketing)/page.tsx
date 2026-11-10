import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { isSupabaseConfigured } from "@/lib/env";
import { HOME_FAQS, pageMeta, SITE_URL } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = pageMeta({
  title: "Book a barbing salon online",
  description:
    "Head Boy BarberPro — also searched as BarberPro and BerbingPro — lets you book a live barbing chair or run a salon with staff, hours, and Paystack.",
  path: "/",
});

const GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=60",
    alt: "Long row of classic barber chairs and wall mirrors",
  },
  {
    src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=60",
    alt: "Wide classic shop with stations and lighting",
  },
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=60",
    alt: "Barber cutting hair in the chair",
  },
  {
    src: "https://images.unsplash.com/photo-1599351431202-1e0f013fd9b1?auto=format&fit=crop&w=900&q=60",
    alt: "Close fade on the shop floor",
  },
];

export default async function HomePage() {
  const salons = isSupabaseConfigured() ? await loadPublishedSalons() : [];

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Head Boy BarberPro",
          alternateName: ["BarberPro", "BerbingPro", "BarbingPro"],
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/salons?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <section className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-24">
        <p className="text-xs uppercase tracking-[0.45em] text-gold">Head Boy BarberPro · BarberPro · BerbingPro</p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
          Book a barbing salon. Run the shop.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          Classic chairs, mirrors, and barbers on the tools. Head Boy BarberPro — also called BarberPro and BerbingPro —
          books live slots and takes Paystack. No dummy calendars.
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
        <p className="mt-2 text-sm text-muted">
          Wide stations, glass, and chairs — the room people remember when they walk in.
        </p>
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

      <section id="faq" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="font-serif text-3xl">Questions people ask</h2>
        <p className="mt-2 text-sm text-muted">Straight answers for Google, AI Overviews, and anyone comparing barbing apps.</p>
        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          {HOME_FAQS.map((item) => (
            <div key={item.q} className="glass-panel rounded-2xl p-6">
              <dt className="font-serif text-xl text-gold">{item.q}</dt>
              <dd className="mt-3 text-sm leading-6 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
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
