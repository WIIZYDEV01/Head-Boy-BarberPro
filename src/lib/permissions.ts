export const SALON_ROLES = ["owner", "manager", "barber"] as const;
export type SalonRole = (typeof SALON_ROLES)[number];

export function canManageSalonSettings(role: SalonRole | null) {
  return role === "owner" || role === "manager";
}

export function canManageStaff(role: SalonRole | null) {
  return role === "owner" || role === "manager";
}

export function canManageServices(role: SalonRole | null) {
  return role === "owner" || role === "manager";
}

export function canManageCustomers(role: SalonRole | null) {
  return role === "owner" || role === "manager" || role === "barber";
}

export function canManageAllAppointments(role: SalonRole | null) {
  return role === "owner" || role === "manager";
}

export function canCompleteAppointments(role: SalonRole | null) {
  return role === "owner" || role === "manager" || role === "barber";
}

export function canViewRevenue(role: SalonRole | null) {
  return role === "owner" || role === "manager";
}

export function canAssignRole(actor: SalonRole, next: SalonRole) {
  if (actor === "owner") return next !== "owner";
  if (actor === "manager") return next === "barber";
  return false;
}

export function assertSameSalon<T extends { salon_id: string }>(
  records: T[],
  salonId: string,
) {
  return records.every((record) => record.salon_id === salonId);
}
