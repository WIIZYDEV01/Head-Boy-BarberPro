import { addStaffAction, deactivateStaffForm, updateBarberAction } from "@/app/actions/staff";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSalonAccess } from "@/lib/auth/session";
import { canManageStaff } from "@/lib/permissions";

export default async function StaffPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;
  const { supabase, role } = await requireSalonAccess(salonId);
  const { data: barbers } = await supabase
    .from("barbers")
    .select("*, salon_memberships(id, role, status, user_id)")
    .eq("salon_id", salonId)
    .order("display_name");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h2 className="font-serif text-2xl">Staff</h2>
        {!barbers?.length ? (
          <div className="mt-4">
            <EmptyState title="No staff profiles" description="The owner profile is created with the salon. Add more people after they sign in." />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {barbers.map((barber) => {
              const membership = Array.isArray(barber.salon_memberships)
                ? barber.salon_memberships[0]
                : barber.salon_memberships;
              return (
                <li key={barber.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium">{barber.display_name}</p>
                  <p className="text-sm text-muted">
                    {membership?.role} · {membership?.status} · {barber.is_active ? "Active on chair" : "Inactive"}
                  </p>
                  {canManageStaff(role) ? (
                    <div className="mt-4 space-y-3">
                      <ActionForm action={updateBarberAction.bind(null, salonId, barber.id)} submitLabel="Save staff">
                        <Input name="displayName" defaultValue={barber.display_name} required />
                        <Textarea name="bio" defaultValue={barber.bio ?? ""} />
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="isActive" defaultChecked={barber.is_active} />
                          Active
                        </label>
                      </ActionForm>
                      {membership && membership.role !== "owner" ? (
                        <form action={deactivateStaffForm.bind(null, salonId, membership.id, barber.id)}>
                          <Button type="submit" variant="destructive" size="sm">
                            Deactivate membership
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {canManageStaff(role) ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-serif text-xl">Add staff by email</h3>
          <p className="mt-2 text-xs text-muted">They must already have a Head Boy BarberPro account. Role escalation to owner is blocked.</p>
          <div className="mt-4">
            <ActionForm action={addStaffAction.bind(null, salonId)} submitLabel="Add staff">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" name="displayName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select id="role" name="role" className="h-10 w-full rounded-md border border-border bg-background px-3">
                  <option value="barber">Barber</option>
                  {role === "owner" ? <option value="manager">Manager</option> : null}
                </select>
              </div>
              <Textarea name="bio" placeholder="Specialties or bio" />
            </ActionForm>
          </div>
        </div>
      ) : null}
    </div>
  );
}
