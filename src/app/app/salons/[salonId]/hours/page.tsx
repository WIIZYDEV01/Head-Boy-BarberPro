import { addTimeOffAction, deleteTimeOffForm, saveWorkingHoursAction } from "@/app/actions/hours";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSalonAccess } from "@/lib/auth/session";
import { canManageSalonSettings } from "@/lib/permissions";
import { formatInTimeZone } from "@/lib/time";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function HoursPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;
  const { supabase, role } = await requireSalonAccess(salonId);
  const { data: hours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("salon_id", salonId)
    .is("barber_id", null)
    .order("day_of_week");
  const { data: barbers } = await supabase.from("barbers").select("id, display_name").eq("salon_id", salonId);
  const { data: timeOff } = await supabase.from("time_off").select("*").eq("salon_id", salonId).order("starts_at");
  const { data: salon } = await supabase.from("salons").select("timezone").eq("id", salonId).single();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="font-serif text-2xl">Opening hours</h2>
        {canManageSalonSettings(role) ? (
          <div className="mt-4">
            <ActionForm action={saveWorkingHoursAction.bind(null, salonId)} submitLabel="Save hours">
              {(hours ?? []).map((row) => (
                <div key={row.id} className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-2">
                  <span className="text-sm">{DAYS[row.day_of_week]}</span>
                  <Input type="time" name={`start_${row.day_of_week}`} defaultValue={String(row.start_time).slice(0, 5)} />
                  <Input type="time" name={`end_${row.day_of_week}`} defaultValue={String(row.end_time).slice(0, 5)} />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name={`closed_${row.day_of_week}`} defaultChecked={row.is_closed} />
                    Closed
                  </label>
                </div>
              ))}
            </ActionForm>
          </div>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {(hours ?? []).map((row) => (
              <li key={row.id}>
                {DAYS[row.day_of_week]}: {row.is_closed ? "Closed" : `${row.start_time} – ${row.end_time}`}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="font-serif text-2xl">Time off</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(timeOff ?? []).map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
              <span>
                {formatInTimeZone(new Date(row.starts_at), salon?.timezone ?? "UTC")} →{" "}
                {formatInTimeZone(new Date(row.ends_at), salon?.timezone ?? "UTC")}
                {row.reason ? ` · ${row.reason}` : ""}
              </span>
              <form action={deleteTimeOffForm.bind(null, salonId, row.id)}>
                <Button type="submit" size="sm" variant="secondary">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border border-border p-4">
          <h3 className="font-serif text-lg">Add time off</h3>
          {(barbers ?? []).map((barber) => (
            <div key={barber.id} className="mt-4">
              <p className="text-sm text-muted">{barber.display_name}</p>
              <ActionForm action={addTimeOffAction.bind(null, salonId, barber.id)} submitLabel="Add">
                <Label>Starts</Label>
                <Input name="startsAt" type="datetime-local" required />
                <Label>Ends</Label>
                <Input name="endsAt" type="datetime-local" required />
                <Input name="reason" placeholder="Reason" />
              </ActionForm>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
