import { updateProfileAction } from "@/app/actions/profile";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile } from "@/lib/auth/session";

export default async function ProfilePage() {
  const { profile, user } = await getProfile();
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-serif text-4xl">Profile</h1>
      <p className="text-sm text-muted">{user.email}</p>
      <ActionForm action={updateProfileAction} submitLabel="Save profile">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={profile.full_name ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
        </div>
      </ActionForm>
    </div>
  );
}
