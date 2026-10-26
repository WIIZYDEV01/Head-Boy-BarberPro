import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfile } from "@/lib/auth/session";

export default async function AdminPage() {
  const { profile, supabase } = await getProfile();
  if (!profile.is_platform_admin) redirect("/app");

  const { data: salons } = await supabase.from("salons").select("id, name, slug, is_active, is_published, created_at").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-serif text-4xl">Platform administration</h1>
      <p className="mt-2 text-sm text-muted">
        Restricted to profiles with is_platform_admin. Grant this flag in Supabase; users cannot set it on themselves.
      </p>
      {!salons?.length ? (
        <div className="mt-8">
          <EmptyState title="No salons on the platform" description="Salons appear after owners create them." />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {salons.map((salon) => (
            <li key={salon.id} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">{salon.name}</p>
              <p className="text-muted">
                {salon.slug} · {salon.is_published ? "published" : "unpublished"} · {salon.is_active ? "active" : "archived"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
