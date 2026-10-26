"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { profileSchema, reviewSchema } from "@/lib/validations";
import type { ActionState } from "@/app/actions/auth";

function refreshAccount() {
  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/app/bookings");
  revalidatePath("/salons");
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    preferredStyle: formData.get("preferredStyle"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const payload = {
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    preferred_style: parsed.data.preferredStyle || null,
  };
  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error && (error.message.includes("preferred_style") || error.code === "PGRST204")) {
    const { error: fallback } = await supabase
      .from("profiles")
      .update({ full_name: payload.full_name, phone: payload.phone })
      .eq("id", user.id);
    if (fallback) return { error: fallback.message };
  } else if (error) {
    return { error: error.message };
  }
  await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });
  refreshAccount();
  return { success: "Profile saved." };
}

export async function toggleSavedSalonAction(salonId: string, saved: boolean): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  if (saved) {
    const { error } = await supabase.from("saved_salons").delete().eq("user_id", user.id).eq("salon_id", salonId);
    if (error) {
      return {
        error: error.message.includes("saved_salons")
          ? "Run supabase/migrations/0004_client_profile.sql to enable saved shops."
          : error.message,
      };
    }
  } else {
    const { error } = await supabase.from("saved_salons").insert({ user_id: user.id, salon_id: salonId });
    if (error) {
      return {
        error: error.message.includes("saved_salons")
          ? "Run supabase/migrations/0004_client_profile.sql to enable saved shops."
          : error.message,
      };
    }
  }
  refreshAccount();
  revalidatePath(`/app/salons/${salonId}`);
  return { success: saved ? "Removed from saved shops." : "Shop saved." };
}

export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = reviewSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, salon_id, customer_id, customer_user_id, status")
    .eq("id", parsed.data.appointmentId)
    .eq("customer_user_id", user.id)
    .maybeSingle();
  if (fetchError || !appointment) return { error: "Appointment not found." };
  if (appointment.status !== "completed") return { error: "You can rate a visit after it is completed." };

  const { error } = await supabase.from("reviews").insert({
    salon_id: appointment.salon_id,
    appointment_id: appointment.id,
    customer_id: appointment.customer_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    is_published: true,
  });
  if (error) {
    if (error.code === "23505") return { error: "You already rated this visit." };
    return { error: error.message };
  }
  refreshAccount();
  return { success: "Thanks — your rating is live on the salon page." };
}
