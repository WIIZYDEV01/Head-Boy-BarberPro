import { createSalonAction } from "@/app/actions/salon";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewSalonPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-serif text-4xl">Create a salon</h1>
        <p className="mt-2 text-sm text-muted">
          You become the owner. Default hours are Monday–Saturday 09:00–18:00. Change them after creation.
        </p>
      </div>
      <ActionForm action={createSalonAction} submitLabel="Create salon">
        <div className="space-y-2">
          <Label htmlFor="name">Salon name</Label>
          <Input id="name" name="name" required minLength={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select id="timezone" name="timezone" defaultValue="Africa/Lagos" className="h-10 w-full rounded-md border border-border bg-card px-3">
            <option value="Africa/Lagos">Africa/Lagos</option>
            <option value="Africa/Accra">Africa/Accra</option>
            <option value="Africa/Nairobi">Africa/Nairobi</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select id="currency" name="currency" defaultValue="NGN" className="h-10 w-full rounded-md border border-border bg-card px-3">
            <option value="NGN">NGN</option>
            <option value="GHS">GHS</option>
            <option value="USD">USD</option>
            <option value="ZAR">ZAR</option>
            <option value="KES">KES</option>
          </select>
        </div>
      </ActionForm>
    </div>
  );
}
