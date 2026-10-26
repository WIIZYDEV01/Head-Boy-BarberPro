import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import { Button } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string; barberId?: string }>;
}) {
  const { slug } = await params;
  const { serviceId, barberId } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: salon } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_active", true)
    .maybeSingle();
  if (!salon) notFound();

  const [{ data: services }, { data: barbers }, session] = await Promise.all([
    supabase.from("services").select("id, name, duration_minutes, price_kobo").eq("salon_id", salon.id).eq("is_active", true),
    supabase.from("barbers").select("id, display_name").eq("salon_id", salon.id).eq("is_active", true),
    getOptionalUser(),
  ]);

  let preferredStyle: string | undefined;
  if (session.user && session.supabase) {
    const { data: profile, error } = await session.supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!error) preferredStyle = profile?.preferred_style ?? undefined;
  }

  return (
    <div className="glass-panel mx-auto max-w-xl rounded-3xl px-6 py-12 md:px-8">
      <h1 className="font-serif text-4xl">Book {salon.name}</h1>
      <p className="mt-2 text-sm text-muted">
        Times are shown in {salon.timezone}. Payment policy: {salon.payment_policy.replace("_", " ")}.
      </p>
      {!session.user ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm">Sign in to submit a booking. This keeps the appointment attached to your account.</p>
          <Button asChild>
            <Link href={`/login?next=/salons/${slug}/book`}>Sign in to book</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <BookingForm
            salonId={salon.id}
            slug={salon.slug}
            timezone={salon.timezone}
            currency={salon.currency}
            services={services ?? []}
            barbers={barbers ?? []}
            initialServiceId={serviceId}
            initialBarberId={barberId}
            initialNotes={preferredStyle}
          />
        </div>
      )}
    </div>
  );
}
