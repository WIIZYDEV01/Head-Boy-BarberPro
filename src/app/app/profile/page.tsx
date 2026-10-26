import { updateProfileAction } from "@/app/actions/profile";
import { ActionForm } from "@/components/forms/action-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProfile, isMissingTable, requireUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const { profile, user } = await getProfile();
  const { supabase } = await requireUser();
  const { count: visitCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("customer_user_id", user.id)
    .eq("status", "completed");

  const saved = await supabase
    .from("saved_salons")
    .select("salon_id, salons(name, slug, city)")
    .eq("user_id", user.id);
  const savedShops = isMissingTable(saved.error) ? [] : (saved.data ?? []);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="glass-panel rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Your chair card</p>
        <h1 className="mt-2 font-serif text-4xl">Profile</h1>
        <p className="mt-2 text-sm text-muted">{user.email}</p>
        <div className="mt-8">
          <AvatarUpload name={profile.full_name ?? user.email ?? "Guest"} currentUrl={profile.avatar_url} />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-2xl font-serif text-gold">{visitCount ?? 0}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">Completed visits</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-2xl font-serif text-gold">{savedShops.length}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">Saved shops</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8">
        <h2 className="font-serif text-2xl">Edit details</h2>
        <p className="mt-2 text-sm text-muted">
          Name and photo show when you book. Style notes travel with you like a Booksy client card.
        </p>
        <div className="mt-6">
          <ActionForm action={updateProfileAction} submitLabel="Save profile">
            <div className="space-y-2">
              <Label htmlFor="fullName">Display name</Label>
              <Input id="fullName" name="fullName" defaultValue={profile.full_name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="WhatsApp or mobile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredStyle">Preferred cut / notes</Label>
              <Textarea
                id="preferredStyle"
                name="preferredStyle"
                defaultValue={profile.preferred_style ?? ""}
                placeholder="Low fade, beard line-up, no clippers on top…"
              />
            </div>
          </ActionForm>
        </div>
      </div>

      {savedShops.length ? (
        <div className="glass-panel rounded-3xl p-8">
          <h2 className="font-serif text-2xl">Saved shops</h2>
          <ul className="mt-4 space-y-3">
            {savedShops.map((row) => {
              const salon = (
                Array.isArray(row.salons) ? row.salons[0] : row.salons
              ) as { name?: string; slug?: string; city?: string } | null;
              return (
                <li key={row.salon_id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    {salon?.name ?? "Salon"}
                    {salon?.city ? <span className="text-muted"> · {salon.city}</span> : null}
                  </span>
                  {salon?.slug ? (
                    <a href={`/salons/${salon.slug}`} className="text-gold">
                      Book again
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
