import { addMinutes, parseHm, rangesOverlap, zonedWallTimeToUtc } from "@/lib/time";

export type WorkingHour = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
};

export type BusyRange = {
  starts_at: Date;
  ends_at: Date;
};

export function generateSlots(input: {
  dateIso: string;
  timeZone: string;
  durationMinutes: number;
  bufferMinutes: number;
  hours: WorkingHour | null;
  busy: BusyRange[];
  timeOff: BusyRange[];
  now?: Date;
  slotStepMinutes?: number;
}): Date[] {
  const now = input.now ?? new Date();
  const step = input.slotStepMinutes ?? 15;
  if (!input.hours || input.hours.is_closed) return [];

  const start = zonedWallTimeToUtc(
    input.dateIso,
    input.hours.start_time.slice(0, 5),
    input.timeZone,
  );
  const end = zonedWallTimeToUtc(
    input.dateIso,
    input.hours.end_time.slice(0, 5),
    input.timeZone,
  );

  if (!(end > start)) return [];
  if (parseHm(input.hours.end_time) <= parseHm(input.hours.start_time)) return [];

  const slots: Date[] = [];
  const total = input.durationMinutes + input.bufferMinutes;

  for (let cursor = start; addMinutes(cursor, total) <= end; cursor = addMinutes(cursor, step)) {
    const slotEnd = addMinutes(cursor, total);
    if (cursor < now) continue;
    const blocked = [...input.busy, ...input.timeOff].some((range) =>
      rangesOverlap(cursor, slotEnd, range.starts_at, range.ends_at),
    );
    if (!blocked) slots.push(cursor);
  }

  return slots;
}

export function canTransitionAppointment(
  from: string,
  to: string,
): boolean {
  const allowed: Record<string, string[]> = {
    pending_payment: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled", "no_show"],
    completed: [],
    cancelled: [],
    no_show: [],
  };
  return allowed[from]?.includes(to) ?? false;
}

export function canCustomerMutate(input: {
  startsAt: Date;
  cancellationHours: number;
  now?: Date;
  status: string;
}) {
  if (input.status !== "confirmed" && input.status !== "pending_payment") {
    return false;
  }
  const now = input.now ?? new Date();
  const deadline = new Date(
    input.startsAt.getTime() - input.cancellationHours * 60 * 60 * 1000,
  );
  return now <= deadline;
}
