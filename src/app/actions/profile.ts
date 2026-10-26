"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { profileSchema, reviewSchema } from "@/lib/validations";
import type { ActionState } from "@/app/actions/auth";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

function isUploadBlob(value: unknown): value is Blob {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && typeof value.arrayBuffer === "function";
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionState> {
  try {
    const file = formData.get("file");
    if (!isUploadBlob(file) || file.size === 0) return { error: "Choose a photo." };
    const type = "type" in file && typeof file.type === "string" ? file.type : "image/jpeg";
    if (type && !IMAGE_TYPES.has(type) && type !== "application/octet-stream") {
      return { error: "Use a JPEG, PNG, or WebP image." };
    }
    if (file.size > 2.5 * 1024 * 1024) return { error: "Photos must be 2MB or smaller." };

    const { supabase, user } = await requireUser();
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const path = `profile-avatars/${user.id}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = IMAGE_TYPES.has(type) ? type : "image/jpeg";

    let publicUrl: string | null = null;
    try {
      const admin = createServiceRoleClient();
      const { error: uploadError } = await admin.storage.from("salon-assets").upload(path, bytes, {
        contentType,
        upsert: true,
      });
      if (uploadError) throw uploadError;
      publicUrl = admin.storage.from("salon-assets").getPublicUrl(path).data.publicUrl;
    } catch {
      const { error: fallbackError } = await supabase.storage.from("salon-assets").upload(path, bytes, {
        contentType,
        upsert: true,
      });
      if (fallbackError) {
        return { error: fallbackError.message || "Photo upload failed. Try a smaller JPEG." };
      }
      publicUrl = supabase.storage.from("salon-assets").getPublicUrl(path).data.publicUrl;
    }

    if (!publicUrl) return { error: "Upload finished without a photo URL." };
    const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    if (error) return { error: error.message };
    refreshAccount();
    return { success: "Photo updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Photo upload failed. Try a smaller JPEG." };
  }
}

export async function removeAvatarAction(): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: error.message };
  refreshAccount();
  return { success: "Photo removed." };
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
