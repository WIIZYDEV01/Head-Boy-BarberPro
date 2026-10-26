import { upsertServiceAction, deactivateServiceForm } from "@/app/actions/services";
import { ActionForm } from "@/components/forms/action-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { requireSalonAccess } from "@/lib/auth/session";
import { formatMoney, fromMinorUnits } from "@/lib/money";
import { canManageServices } from "@/lib/permissions";

export default async function ServicesPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;
  const { supabase, role } = await requireSalonAccess(salonId);
  const { data: salon } = await supabase.from("salons").select("currency").eq("id", salonId).single();
  const { data: services } = await supabase.from("services").select("*").eq("salon_id", salonId).order("name");
  const createAction = upsertServiceAction.bind(null, salonId, null);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h2 className="font-serif text-2xl">Services</h2>
        {!services?.length ? (
          <div className="mt-4">
            <EmptyState title="No services" description="Add a live service such as a skin fade or beard trim. Nothing is preloaded." />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {services.map((service) => (
              <li key={service.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted">
                      {formatMoney(service.price_kobo, salon?.currency ?? "NGN")} · {service.duration_minutes} min ·{" "}
                      {service.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  {canManageServices(role) ? (
                    <form action={deactivateServiceForm.bind(null, salonId, service.id)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Deactivate
                      </Button>
                    </form>
                  ) : null}
                </div>
                {canManageServices(role) ? (
                  <div className="mt-4">
                    <ActionForm
                      action={upsertServiceAction.bind(null, salonId, service.id)}
                      submitLabel="Save"
                    >
                      <ServiceFields
                        defaultValues={{
                          name: service.name,
                          description: service.description ?? "",
                          category: service.category ?? "",
                          priceMajor: String(fromMinorUnits(service.price_kobo)),
                          durationMinutes: String(service.duration_minutes),
                          isActive: service.is_active,
                        }}
                      />
                    </ActionForm>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      {canManageServices(role) ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-serif text-xl">Add service</h3>
          <div className="mt-4">
            <ActionForm action={createAction} submitLabel="Create service">
              <ServiceFields />
            </ActionForm>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ServiceFields({
  defaultValues,
}: {
  defaultValues?: {
    name: string;
    description: string;
    category: string;
    priceMajor: string;
    durationMinutes: string;
    isActive: boolean;
  };
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" defaultValue={defaultValues?.category} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="priceMajor">Price (major units)</Label>
        <Input id="priceMajor" name="priceMajor" type="number" step="0.01" min="0" defaultValue={defaultValues?.priceMajor ?? "0"} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="durationMinutes">Duration (minutes)</Label>
        <Input id="durationMinutes" name="durationMinutes" type="number" min="10" defaultValue={defaultValues?.durationMinutes ?? "30"} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={defaultValues?.description} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        Active
      </label>
    </>
  );
}
