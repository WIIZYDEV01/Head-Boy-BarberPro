import { anonymizeCustomerForm, upsertCustomerAction } from "@/app/actions/customers";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSalonAccess } from "@/lib/auth/session";
import { canManageSalonSettings } from "@/lib/permissions";

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ salonId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { salonId } = await params;
  const { q } = await searchParams;
  const { supabase, role } = await requireSalonAccess(salonId);
  let query = supabase.from("customers").select("*").eq("salon_id", salonId).order("full_name");
  if (q) query = query.ilike("full_name", `%${q}%`);
  const { data: customers } = await query;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h2 className="font-serif text-2xl">Customers</h2>
        <form className="mt-4">
          <Input name="q" placeholder="Search by name" defaultValue={q} />
        </form>
        {!customers?.length ? (
          <div className="mt-4">
            <EmptyState title="No customers" description="Customers appear when you add them or when someone books." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {customers.map((customer) => (
              <li key={customer.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{customer.full_name}</p>
                <p className="text-sm text-muted">{customer.email || customer.phone || "No contact details"}</p>
                <div className="mt-3">
                  <ActionForm action={upsertCustomerAction.bind(null, salonId, customer.id)} submitLabel="Save">
                    <Input name="fullName" defaultValue={customer.full_name} required />
                    <Input name="email" type="email" defaultValue={customer.email ?? ""} />
                    <Input name="phone" defaultValue={customer.phone ?? ""} />
                    <Input name="notes" defaultValue={customer.notes ?? ""} />
                  </ActionForm>
                </div>
                {canManageSalonSettings(role) ? (
                  <form action={anonymizeCustomerForm.bind(null, salonId, customer.id)} className="mt-2">
                    <Button type="submit" variant="secondary" size="sm">
                      Anonymize
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-serif text-xl">Add customer</h3>
        <div className="mt-4">
          <ActionForm action={upsertCustomerAction.bind(null, salonId, null)} submitLabel="Add customer">
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <Input name="email" type="email" placeholder="Email" />
            <Input name="phone" placeholder="Phone" />
            <Input name="notes" placeholder="Notes" />
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
