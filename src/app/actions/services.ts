"use server";

import { revalidatePath } from "next/cache";
import { requireSalonAccess } from "@/lib/auth/session";
import { toMinorUnits } from "@/lib/money";
import { serviceSchema } from "@/lib/validations";
import type { ActionState } from "@/app/actions/auth";

export async function upsertServiceAction(
  salonId: string,
  serviceId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    priceMajor: formData.get("priceMajor"),
    durationMinutes: formData.get("durationMinutes"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const payload = {
    salon_id: salonId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    price_kobo: toMinorUnits(parsed.data.priceMajor),
    duration_minutes: parsed.data.durationMinutes,
    is_active: parsed.data.isActive ?? true,
  };

  const query = serviceId
    ? supabase.from("services").update(payload).eq("id", serviceId).eq("salon_id", salonId)
    : supabase.from("services").insert(payload);

  const { error } = await query;
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/services`);
  return { success: serviceId ? "Service updated." : "Service created." };
}

export async function deactivateServiceAction(
  salonId: string,
  serviceId: string,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", serviceId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/services`);
  return { success: "Service deactivated. Historical appointments keep the original price." };
}

export async function deactivateServiceForm(salonId: string, serviceId: string, formData: FormData) {
  void formData;
  await deactivateServiceAction(salonId, serviceId);
}
