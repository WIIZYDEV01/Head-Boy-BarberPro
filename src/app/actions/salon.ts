"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requireSalonAccess } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { salonSchema } from "@/lib/validations";
import type { ActionState } from "@/app/actions/auth";

export async function createSalonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = salonSchema.pick({ name: true, timezone: true, currency: true }).safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone") || "Africa/Lagos",
    currency: formData.get("currency") || "NGN",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { supabase, user } = await requireUser();
  const base = slugify(parsed.data.name) || "salon";
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase
    .from("salons")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      slug,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/app");
  redirect(`/app/salons/${data.id}`);
}

export async function updateSalonAction(
  salonId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSalonAccess(salonId, ["owner", "manager"]);
  const parsed = salonSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    paymentPolicy: formData.get("paymentPolicy"),
    depositPercent: formData.get("depositPercent"),
    bookingBufferMinutes: formData.get("bookingBufferMinutes"),
    cancellationHours: formData.get("cancellationHours"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { error } = await supabase
    .from("salons")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      address_line: parsed.data.addressLine || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      country: parsed.data.country || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      payment_policy: parsed.data.paymentPolicy,
      deposit_percent: parsed.data.depositPercent,
      booking_buffer_minutes: parsed.data.bookingBufferMinutes,
      cancellation_hours: parsed.data.cancellationHours,
      is_published: parsed.data.isPublished ?? false,
    })
    .eq("id", salonId);

  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}`);
  revalidatePath("/salons");
  return { success: "Salon updated." };
}

export async function archiveSalonAction(salonId: string): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner"]);
  const { error } = await supabase
    .from("salons")
    .update({ is_active: false, is_published: false })
    .eq("id", salonId);
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: "Salon archived. It is no longer visible for new bookings." };
}

export async function archiveSalonForm(salonId: string, formData: FormData) {
  void formData;
  await archiveSalonAction(salonId);
}
