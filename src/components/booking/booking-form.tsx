"use client";

import { useState } from "react";
import { bookAppointmentAction } from "@/app/actions/booking";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { formatInTimeZone } from "@/lib/time";

type Service = { id: string; name: string; duration_minutes: number; price_kobo: number };
type Barber = { id: string; display_name: string };

export function BookingForm({
  salonId,
  slug,
  timezone,
  currency,
  services,
  barbers,
}: {
  salonId: string;
  slug: string;
  timezone: string;
  currency: string;
  services: Service[];
  barbers: Barber[];
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const service = services.find((item) => item.id === serviceId);

  async function loadSlots() {
    if (!serviceId || !date) {
      setError("Choose a service and date first.");
      return;
    }
    const params = new URLSearchParams({ salonId, serviceId, date });
    if (barberId) params.set("barberId", barberId);
    setLoading(true);
    setError(null);
    setStartsAt("");
    try {
      const res = await fetch(`/api/availability?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load slots");
      setSlots(json.slots ?? []);
    } catch (err: unknown) {
      setSlots([]);
      setError(err instanceof Error ? err.message : "Could not load slots");
    } finally {
      setLoading(false);
    }
  }

  if (!services.length) {
    return <p className="text-sm text-muted">This salon has no bookable services yet.</p>;
  }

  return (
    <ActionForm action={bookAppointmentAction} submitLabel="Confirm booking" pendingLabel="Booking…">
      <input type="hidden" name="salonId" value={salonId} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <div className="space-y-2">
        <Label htmlFor="serviceId">Service</Label>
        <select
          id="serviceId"
          name="serviceId"
          className="h-10 w-full rounded-md border border-border bg-card px-3"
          value={serviceId}
          onChange={(event) => {
            setServiceId(event.target.value);
            setSlots([]);
            setStartsAt("");
          }}
        >
          {services.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.duration_minutes}m · {formatMoney(item.price_kobo, currency)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="barberId">Barber</Label>
        <select
          id="barberId"
          name="barberId"
          className="h-10 w-full rounded-md border border-border bg-card px-3"
          value={barberId}
          onChange={(event) => {
            setBarberId(event.target.value);
            setSlots([]);
            setStartsAt("");
          }}
        >
          <option value="">Any available barber</option>
          {barbers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.display_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <input
          id="date"
          type="date"
          className="h-10 w-full rounded-md border border-border bg-card px-3"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => {
            setDate(event.target.value);
            setStartsAt("");
            setSlots([]);
          }}
        />
      </div>
      <Button type="button" variant="secondary" onClick={loadSlots} disabled={loading}>
        {loading ? "Checking calendar…" : "Show available times"}
      </Button>
      <div className="space-y-2">
        <p className="text-sm font-medium">Available times</p>
        {loading ? <p className="text-sm text-muted">Checking the calendar…</p> : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {!loading && date && serviceId && slots.length === 0 ? (
          <p className="text-sm text-muted">No openings on this date for the selected barber and service.</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <Button
              key={slot}
              type="button"
              variant={startsAt === slot ? "default" : "secondary"}
              size="sm"
              onClick={() => setStartsAt(slot)}
            >
              {formatInTimeZone(new Date(slot), timezone, false)}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional notes for the salon" />
      </div>
      {service ? (
        <p className="text-sm text-muted">
          You are booking {service.name} at {slug}. You must be signed in. If this salon requires a Paystack deposit or
          full payment, checkout opens after the appointment is saved.
        </p>
      ) : null}
    </ActionForm>
  );
}
