import type { ReactNode } from "react";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { SchemaMissing } from "@/components/setup/schema-missing";
import { getMemberships, isSchemaMissingError } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let memberships;
  let profile;
  try {
    const result = await getMemberships();
    memberships = result.memberships;
    profile = result.profile;
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return <SchemaMissing />;
    }
    throw error;
  }
  const items = [
    { href: "/app", label: "Overview" },
    { href: "/app/bookings", label: "My bookings" },
    { href: "/app/profile", label: "Profile" },
    { href: "/app/salons/new", label: "New salon" },
    ...memberships.map((membership) => {
      const salon = Array.isArray(membership.salons) ? membership.salons[0] : membership.salons;
      return {
        href: `/app/salons/${membership.salon_id}`,
        label: salon?.name ?? "Salon",
      };
    }),
  ];
  if (profile.is_platform_admin) {
    items.push({ href: "/app/admin", label: "Platform admin" });
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar
        items={items}
        userName={profile.full_name ?? "Account"}
        avatarUrl={profile.avatar_url}
      />
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
