"use server";

import { revalidatePath } from "next/cache";
import { requireSalonAccess } from "@/lib/auth/session";
import type { ActionState } from "@/app/actions/auth";

export async function saveWorkingHoursAction(
  salonId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const rows = [];
  for (let day = 0; day <= 6; day += 1) {
    rows.push({
      salon_id: salonId,
      barber_id: null,
      day_of_week: day,
      start_time: String(formData.get(`start_${day}`) || "09:00"),
      end_time: String(formData.get(`end_${day}`) || "18:00"),
      is_closed: formData.get(`closed_${day}`) === "on",
    });
  }

  for (const row of rows) {
    const { error } = await supabase.from("working_hours").upsert(row, {
      onConflict: "salon_id,day_of_week",
    });
    if (error) {
      const { error: updateError } = await supabase
        .from("working_hours")
        .update({
          start_time: row.start_time,
          end_time: row.end_time,
          is_closed: row.is_closed,
        })
        .eq("salon_id", salonId)
        .is("barber_id", null)
        .eq("day_of_week", row.day_of_week);
      if (updateError) return { error: updateError.message };
    }
  }

  revalidatePath(`/app/salons/${salonId}/hours`);
  return { success: "Opening hours saved." };
}

export async function addTimeOffAction(
  salonId: string,
  barberId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId);
  const startsAt = String(formData.get("startsAt") || "");
  const endsAt = String(formData.get("endsAt") || "");
  if (!startsAt || !endsAt) return { error: "Start and end are required." };
  if (new Date(endsAt) <= new Date(startsAt)) return { error: "End must be after start." };
  const { error } = await supabase.from("time_off").insert({
    salon_id: salonId,
    barber_id: barberId,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    reason: String(formData.get("reason") || "") || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/hours`);
  return { success: "Time off saved." };
}

export async function deleteTimeOffAction(salonId: string, timeOffId: string): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId);
  const { error } = await supabase.from("time_off").delete().eq("id", timeOffId).eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/hours`);
  return { success: "Time off removed." };
}

export async function deleteTimeOffForm(salonId: string, timeOffId: string, formData: FormData) {
  void formData;
  await deleteTimeOffAction(salonId, timeOffId);
}
