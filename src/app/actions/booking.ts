"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { requiredChargeKobo } from "@/lib/money";
import { bookingSchema } from "@/lib/validations";
import { createPaymentReference, initializePaystackTransaction } from "@/lib/paystack";
import { getAppUrl } from "@/lib/env";
import type { ActionState } from "@/app/actions/auth";

export async function bookAppointmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = bookingSchema.safeParse({
    salonId: formData.get("salonId"),
    serviceId: formData.get("serviceId"),
    barberId: formData.get("barberId") || null,
    startsAt: formData.get("startsAt"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { supabase, user } = await requireUser();
  const { data: appointmentId, error } = await supabase.rpc("book_appointment", {
    p_salon_id: parsed.data.salonId,
    p_service_id: parsed.data.serviceId,
    p_barber_id: parsed.data.barberId,
    p_starts_at: parsed.data.startsAt,
    p_notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };
  if (!appointmentId) return { error: "Booking failed." };

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("*, salons(payment_policy, deposit_percent, currency, name)")
    .eq("id", appointmentId)
    .single();
  if (fetchError || !appointment) return { error: "Booking saved but could not be loaded." };

  const salon = appointment.salons as unknown as {
    payment_policy: "full" | "deposit" | "at_salon";
    deposit_percent: number;
    currency: string;
    name: string;
  };

  const amount = requiredChargeKobo({
    priceKobo: appointment.price_kobo,
    policy: salon.payment_policy,
    depositPercent: salon.deposit_percent,
  });

  if (amount <= 0) {
    redirect(`/app/bookings?booked=${appointmentId}`);
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      error:
        "This salon requires online payment, but PAYSTACK_SECRET_KEY is not configured. The slot is held for 15 minutes.",
    };
  }

  const reference = createPaymentReference();
  const { error: payInsertError } = await supabase.from("payments").insert({
    salon_id: appointment.salon_id,
    appointment_id: appointment.id,
    amount_kobo: amount,
    currency: appointment.currency,
    provider: "paystack",
    reference,
    status: "pending",
    metadata: { policy: salon.payment_policy },
  });
  if (payInsertError) return { error: payInsertError.message };

  let checkoutUrl: string;
  try {
    const checkout = await initializePaystackTransaction({
      email: user.email ?? "customer@barberpro.app",
      amountKobo: amount,
      currency: appointment.currency,
      reference,
      callbackUrl: `${getAppUrl()}/payments/callback`,
      metadata: {
        appointment_id: appointment.id,
        salon_id: appointment.salon_id,
        payment_reference: reference,
      },
    });
    checkoutUrl = checkout.authorization_url;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Payment initialization failed." };
  }
  redirect(checkoutUrl);
}
