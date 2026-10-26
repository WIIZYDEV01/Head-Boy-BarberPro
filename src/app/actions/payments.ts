"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { mapPaystackStatus, verifyPaystackTransaction } from "@/lib/paystack";

export async function applyVerifiedPayment(reference: string) {
  const verified = await verifyPaystackTransaction(reference);
  const admin = createServiceRoleClient();
  const nextStatus = mapPaystackStatus(verified.status);

  const { data: payment, error } = await admin
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .single();
  if (error || !payment) {
    throw new Error("Unknown payment reference");
  }

  if (
    verified.amount !== payment.amount_kobo ||
    verified.currency.toUpperCase() !== payment.currency.toUpperCase()
  ) {
    throw new Error("Payment amount or currency does not match the recorded charge");
  }

  if (payment.status === "success") {
    return { payment, alreadyProcessed: true, status: "success" as const };
  }

  const { error: updateError } = await admin
    .from("payments")
    .update({
      status: nextStatus,
      provider_reference: String(verified.id),
      paid_at: nextStatus === "success" ? verified.paid_at : null,
      metadata: {
        ...(typeof payment.metadata === "object" && payment.metadata ? payment.metadata : {}),
        paystack_status: verified.status,
      },
    })
    .eq("id", payment.id)
    .neq("status", "success");

  if (updateError) throw updateError;

  if (nextStatus === "success") {
    await admin
      .from("appointments")
      .update({ status: "confirmed", hold_expires_at: null })
      .eq("id", payment.appointment_id)
      .eq("status", "pending_payment");
  }

  return { payment, alreadyProcessed: false, status: nextStatus };
}
