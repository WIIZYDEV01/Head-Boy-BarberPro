import { NextResponse } from "next/server";
import { generateSlots } from "@/lib/booking/availability";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { weekdayInTimeZone, zonedWallTimeToUtc } from "@/lib/time";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const salonId = url.searchParams.get("salonId");
  const serviceId = url.searchParams.get("serviceId");
  const dateIso = url.searchParams.get("date");
  const barberId = url.searchParams.get("barberId");

  if (!salonId || !serviceId || !dateIso) {
    return NextResponse.json({ error: "salonId, serviceId, and date are required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: salon } = await supabase.from("salons").select("*").eq("id", salonId).maybeSingle();
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .maybeSingle();

  if (!salon || !service) {
    return NextResponse.json({ error: "Salon or service not found" }, { status: 404 });
  }

  const day = weekdayInTimeZone(zonedWallTimeToUtc(dateIso, "12:00", salon.timezone), salon.timezone);
  const from = zonedWallTimeToUtc(dateIso, "00:00", salon.timezone);
  const to = zonedWallTimeToUtc(dateIso, "23:59", salon.timezone);

  let barberQuery = supabase
    .from("barbers")
    .select("id")
    .eq("salon_id", salonId)
    .eq("is_active", true);
  if (barberId) barberQuery = barberQuery.eq("id", barberId);
  const { data: barbers } = await barberQuery;

  const targetBarbers = barbers ?? [];
  const allSlots = new Set<string>();

  for (const barber of targetBarbers) {
    const { data: barberHours } = await supabase
      .from("working_hours")
      .select("*")
      .eq("salon_id", salonId)
      .eq("barber_id", barber.id)
      .eq("day_of_week", day)
      .maybeSingle();
    const { data: salonHours } = await supabase
      .from("working_hours")
      .select("*")
      .eq("salon_id", salonId)
      .is("barber_id", null)
      .eq("day_of_week", day)
      .maybeSingle();
    const hours = barberHours ?? salonHours;
    const { data: busy } = await supabase.rpc("barber_busy_ranges", {
      p_salon_id: salonId,
      p_barber_id: barber.id,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    const slots = generateSlots({
      dateIso,
      timeZone: salon.timezone,
      durationMinutes: service.duration_minutes,
      bufferMinutes: salon.booking_buffer_minutes,
      hours: hours
        ? {
            day_of_week: hours.day_of_week,
            start_time: String(hours.start_time).slice(0, 5),
            end_time: String(hours.end_time).slice(0, 5),
            is_closed: hours.is_closed,
          }
        : null,
      busy: (busy ?? []).map((range: { starts_at: string; ends_at: string }) => ({
        starts_at: new Date(range.starts_at),
        ends_at: new Date(range.ends_at),
      })),
      timeOff: [],
    });
    slots.forEach((slot) => allSlots.add(slot.toISOString()));
  }

  return NextResponse.json({
    slots: [...allSlots].sort(),
    durationMinutes: service.duration_minutes,
    currency: salon.currency,
    priceKobo: service.price_kobo,
    paymentPolicy: salon.payment_policy,
  });
}
