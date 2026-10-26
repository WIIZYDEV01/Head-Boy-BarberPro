"use server";

import { revalidatePath } from "next/cache";
import { requireSalonAccess } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { canAssignRole } from "@/lib/permissions";
import { staffInviteSchema } from "@/lib/validations";
import type { ActionState } from "@/app/actions/auth";
import type { MembershipRole } from "@/types/database";

export async function addStaffAction(
  salonId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { role: actorRole } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const parsed = staffInviteSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!canAssignRole(actorRole, parsed.data.role as MembershipRole)) {
    return { error: "You cannot assign that role." };
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      error:
        "Adding staff requires SUPABASE_SERVICE_ROLE_KEY on the server so the app can look up the user by email.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const { data: listed, error: lookupError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (lookupError) return { error: lookupError.message };
  const userId = listed.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
  if (!userId) {
    return {
      error:
        "No Head Boy BarberPro account exists for that email. Ask the staff member to sign in first, then add them.",
    };
  }
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { data: membership, error: membershipError } = await supabase
    .from("salon_memberships")
    .insert({
      salon_id: salonId,
      user_id: userId,
      role: parsed.data.role,
      status: "active",
    })
    .select("id")
    .single();
  if (membershipError) return { error: membershipError.message };

  const { error: barberError } = await supabase.from("barbers").insert({
    salon_id: salonId,
    membership_id: membership.id,
    display_name: parsed.data.displayName,
    bio: parsed.data.bio || null,
  });
  if (barberError) return { error: barberError.message };

  revalidatePath(`/app/salons/${salonId}/staff`);
  return { success: "Staff member added." };
}

export async function updateBarberAction(
  salonId: string,
  barberId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const displayName = String(formData.get("displayName") || "").trim();
  if (displayName.length < 2) return { error: "Enter a display name." };
  const { error } = await supabase
    .from("barbers")
    .update({
      display_name: displayName,
      bio: String(formData.get("bio") || "") || null,
      is_active: formData.get("isActive") === "on",
    })
    .eq("id", barberId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/staff`);
  return { success: "Staff profile updated." };
}

export async function deactivateStaffAction(
  salonId: string,
  membershipId: string,
  barberId: string,
): Promise<ActionState> {
  const { supabase, membership } = await requireSalonAccess(salonId, ["owner", "manager"]);
  if (membership.id === membershipId) return { error: "You cannot deactivate your own membership here." };
  const { error: mError } = await supabase
    .from("salon_memberships")
    .update({ status: "deactivated" })
    .eq("id", membershipId)
    .eq("salon_id", salonId);
  if (mError) return { error: mError.message };
  await supabase.from("barbers").update({ is_active: false }).eq("id", barberId).eq("salon_id", salonId);
  revalidatePath(`/app/salons/${salonId}/staff`);
  return { success: "Staff member deactivated." };
}

export async function deactivateStaffForm(
  salonId: string,
  membershipId: string,
  barberId: string,
  formData: FormData,
) {
  void formData;
  await deactivateStaffAction(salonId, membershipId, barberId);
}
