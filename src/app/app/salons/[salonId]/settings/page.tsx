import { archiveSalonForm, updateSalonAction } from "@/app/actions/salon";
import { saveSalonLogoAction } from "@/app/actions/media";
import { ActionForm } from "@/components/forms/action-form";
import { ImageUpload } from "@/components/media/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSalonAccess } from "@/lib/auth/session";

export default async function SettingsPage({ params }: { params: Promise<{ salonId: string }> }) {
  const { salonId } = await params;
  const { supabase, role } = await requireSalonAccess(salonId, ["owner", "manager"]);
  const { data: salon } = await supabase.from("salons").select("*").eq("id", salonId).single();
  if (!salon) return null;

  return (
    <div className="max-w-xl space-y-8">
      <h2 className="font-serif text-2xl">Salon settings</h2>
      <ImageUpload
        salonId={salonId}
        folder="logos"
        currentUrl={salon.logo_url}
        onUploaded={saveSalonLogoAction.bind(null, salonId)}
      />
      <ActionForm action={updateSalonAction.bind(null, salonId)} submitLabel="Save settings">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={salon.name} required />
        </div>
        <Textarea name="description" defaultValue={salon.description ?? ""} placeholder="Description" />
        <Input name="addressLine" defaultValue={salon.address_line ?? ""} placeholder="Address" />
        <Input name="city" defaultValue={salon.city ?? ""} placeholder="City" />
        <Input name="state" defaultValue={salon.state ?? ""} placeholder="State" />
        <Input name="country" defaultValue={salon.country ?? ""} placeholder="Country" />
        <Input name="phone" defaultValue={salon.phone ?? ""} placeholder="Phone" />
        <Input name="email" type="email" defaultValue={salon.email ?? ""} placeholder="Email" />
        <Input name="timezone" defaultValue={salon.timezone} required />
        <select name="currency" defaultValue={salon.currency} className="h-10 w-full rounded-md border border-border bg-card px-3">
          <option value="NGN">NGN</option>
          <option value="GHS">GHS</option>
          <option value="USD">USD</option>
          <option value="ZAR">ZAR</option>
          <option value="KES">KES</option>
        </select>
        <select name="paymentPolicy" defaultValue={salon.payment_policy} className="h-10 w-full rounded-md border border-border bg-card px-3">
          <option value="at_salon">Pay at salon</option>
          <option value="deposit">Deposit</option>
          <option value="full">Full payment online</option>
        </select>
        <Label>Deposit percent</Label>
        <Input name="depositPercent" type="number" min="0" max="100" defaultValue={salon.deposit_percent} />
        <Label>Booking buffer (minutes)</Label>
        <Input name="bookingBufferMinutes" type="number" min="0" max="60" defaultValue={salon.booking_buffer_minutes} />
        <Label>Cancellation notice (hours)</Label>
        <Input name="cancellationHours" type="number" min="0" max="168" defaultValue={salon.cancellation_hours} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked={salon.is_published} />
          Publish in the public directory
        </label>
      </ActionForm>
      {role === "owner" ? (
        <form action={archiveSalonForm.bind(null, salonId)}>
          <Button type="submit" variant="destructive">
            Archive salon
          </Button>
        </form>
      ) : null}
    </div>
  );
}
