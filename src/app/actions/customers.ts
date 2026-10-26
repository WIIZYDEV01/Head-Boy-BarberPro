"use server";

import { revalidatePath } from "next/cache";
import { requireSalonAccess } from "@/lib/auth/session";
import { customerSchema } from "@/lib/validations";
import type { ActionState } from "@/app/actions/auth";

export async function upsertCustomerAction(
  salonId: string,
  customerId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager", "barber"]);
  const parsed = customerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const payload = {
    salon_id: salonId,
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  };

  const { error } = customerId
    ? await supabase.from("customers").update(payload).eq("id", customerId).eq("salon_id", salonId)
    : await supabase.from("customers").insert(payload);

  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/customers`);
  return { success: customerId ? "Customer updated." : "Customer added." };
}

export async function anonymizeCustomerAction(
  salonId: string,
  customerId: string,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { error } = await supabase
    .from("customers")
    .update({
      full_name: "Anonymized customer",
      email: null,
      phone: null,
      notes: null,
      user_id: null,
    })
    .eq("id", customerId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/customers`);
  return { success: "Personal details removed." };
}

export async function anonymizeCustomerForm(salonId: string, customerId: string, formData: FormData) {
  void formData;
  await anonymizeCustomerAction(salonId, customerId);
}
