import { describe, expect, it } from "vitest";
import { canCustomerMutate, canTransitionAppointment, generateSlots } from "../src/lib/booking/availability";

describe("appointment transitions", () => {
  it("allows confirmed to completed and rejects completed to confirmed", () => {
    expect(canTransitionAppointment("confirmed", "completed")).toBe(true);
    expect(canTransitionAppointment("completed", "confirmed")).toBe(false);
  });
});

describe("generateSlots", () => {
  it("skips overlapping busy ranges", () => {
    const slots = generateSlots({
      dateIso: "2026-10-22",
      timeZone: "UTC",
      durationMinutes: 30,
      bufferMinutes: 0,
      hours: { day_of_week: 4, start_time: "09:00", end_time: "11:00", is_closed: false },
      busy: [
        {
          starts_at: new Date("2026-10-22T09:00:00.000Z"),
          ends_at: new Date("2026-10-22T09:30:00.000Z"),
        },
      ],
      timeOff: [],
      now: new Date("2026-10-21T00:00:00.000Z"),
      slotStepMinutes: 30,
    });
    expect(slots.map((slot) => slot.toISOString())).toEqual([
      "2026-10-22T09:30:00.000Z",
      "2026-10-22T10:00:00.000Z",
      "2026-10-22T10:30:00.000Z",
    ]);
  });

  it("returns no slots on a closed day", () => {
    expect(
      generateSlots({
        dateIso: "2026-10-22",
        timeZone: "UTC",
        durationMinutes: 30,
        bufferMinutes: 0,
        hours: { day_of_week: 0, start_time: "09:00", end_time: "18:00", is_closed: true },
        busy: [],
        timeOff: [],
        now: new Date("2026-10-21T00:00:00.000Z"),
      }),
    ).toEqual([]);
  });
});

describe("customer mutation window", () => {
  it("blocks cancellation inside the notice period", () => {
    expect(
      canCustomerMutate({
        startsAt: new Date("2026-10-22T12:00:00.000Z"),
        cancellationHours: 12,
        now: new Date("2026-10-22T08:00:00.000Z"),
        status: "confirmed",
      }),
    ).toBe(false);
  });
});
