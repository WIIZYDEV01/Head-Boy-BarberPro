"use server";

import { revalidatePath } from "next/cache";
import { requireSalonAccess } from "@/lib/auth/session";
import type { ActionState } from "@/app/actions/auth";

export async function saveSalonLogoAction(salonId: string, url: string): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { error } = await supabase.from("salons").update({ logo_url: url }).eq("id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/settings`);
  return { success: "Logo updated." };
}

export async function saveServiceImageAction(
  salonId: string,
  serviceId: string,
  url: string,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { error } = await supabase
    .from("services")
    .update({ image_url: url })
    .eq("id", serviceId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/services`);
  return { success: "Image updated." };
}

export async function saveBarberPhotoAction(
  salonId: string,
  barberId: string,
  url: string,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { error } = await supabase
    .from("barbers")
    .update({ photo_url: url })
    .eq("id", barberId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/staff`);
  return { success: "Photo updated." };
}
