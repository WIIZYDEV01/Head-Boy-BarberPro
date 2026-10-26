"use server";

import { revalidatePath } from "next/cache";
import { requireSalonAccess, requireUser } from "@/lib/auth/session";
import { canTransitionAppointment, canCustomerMutate } from "@/lib/booking/availability";
import type { ActionState } from "@/app/actions/auth";
import type { AppointmentStatus } from "@/types/database";

export async function staffSetAppointmentStatus(
  salonId: string,
  appointmentId: string,
  nextStatus: AppointmentStatus,
): Promise<ActionState> {
  const { supabase, role } = await requireSalonAccess(salonId);
  if (role === "barber" && !["completed", "no_show", "confirmed"].includes(nextStatus)) {
    return { error: "Barbers can only complete, confirm, or mark no-show." };
  }

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("salon_id", salonId)
    .single();
  if (fetchError || !appointment) return { error: "Appointment not found." };
  if (role === "barber") {
    const { data: barber } = await supabase
      .from("barbers")
      .select("id, membership_id, salon_memberships!inner(user_id)")
      .eq("id", appointment.barber_id)
      .single();
    const membership = barber?.salon_memberships as unknown as { user_id: string } | { user_id: string }[] | null;
    const userId = Array.isArray(membership) ? membership[0]?.user_id : membership?.user_id;
    const { user } = await requireUser();
    if (userId !== user.id) return { error: "You can only update your own appointments." };
  }
  if (!canTransitionAppointment(appointment.status, nextStatus)) {
    return { error: `Cannot change ${appointment.status} to ${nextStatus}.` };
  }
  const { error } = await supabase
    .from("appointments")
    .update({ status: nextStatus })
    .eq("id", appointmentId)
    .eq("salon_id", salonId);
  if (error) return { error: error.message };
  revalidatePath(`/app/salons/${salonId}/appointments`);
  return { success: "Appointment updated." };
}

export async function staffSetAppointmentStatusForm(
  salonId: string,
  appointmentId: string,
  nextStatus: AppointmentStatus,
  formData: FormData,
) {
  void formData;
  await staffSetAppointmentStatus(salonId, appointmentId, nextStatus);
}

export async function customerCancelAppointment(appointmentId: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*, salons(cancellation_hours)")
    .eq("id", appointmentId)
    .eq("customer_user_id", user.id)
    .single();
  if (error || !appointment) return { error: "Appointment not found." };
  const salon = appointment.salons as unknown as { cancellation_hours: number };
  if (
    !canCustomerMutate({
      startsAt: new Date(appointment.starts_at),
      cancellationHours: salon.cancellation_hours,
      status: appointment.status,
    })
  ) {
    return { error: "This booking can no longer be cancelled under the salon policy." };
  }
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("customer_user_id", user.id);
  if (updateError) return { error: updateError.message };
  revalidatePath("/app/bookings");
  return { success: "Booking cancelled." };
}

export async function customerCancelAppointmentForm(appointmentId: string, formData: FormData) {
  void formData;
  await customerCancelAppointment(appointmentId);
}

export async function customerRescheduleAppointment(
  appointmentId: string,
  startsAtIso: string,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*, salons(cancellation_hours, booking_buffer_minutes)")
    .eq("id", appointmentId)
    .eq("customer_user_id", user.id)
    .single();
  if (error || !appointment) return { error: "Appointment not found." };
  const salon = appointment.salons as unknown as {
    cancellation_hours: number;
    booking_buffer_minutes: number;
  };
  if (
    !canCustomerMutate({
      startsAt: new Date(appointment.starts_at),
      cancellationHours: salon.cancellation_hours,
      status: appointment.status,
    })
  ) {
    return { error: "This booking can no longer be rescheduled under the salon policy." };
  }
  const starts = new Date(startsAtIso);
  if (Number.isNaN(starts.getTime()) || starts <= new Date()) {
    return { error: "Choose a future time." };
  }
  const ends = new Date(
    starts.getTime() +
      (appointment.duration_minutes_snapshot + salon.booking_buffer_minutes) * 60_000,
  );
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ starts_at: starts.toISOString(), ends_at: ends.toISOString() })
    .eq("id", appointmentId)
    .eq("customer_user_id", user.id);
  if (updateError) return { error: updateError.message };
  revalidatePath("/app/bookings");
  return { success: "Booking rescheduled." };
}
