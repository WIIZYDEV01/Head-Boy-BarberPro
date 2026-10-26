import type { ReactNode } from "react";
import Link from "next/link";
import { requireSalonAccess } from "@/lib/auth/session";
import { canManageSalonSettings, canViewRevenue } from "@/lib/permissions";

export default async function SalonLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const { role, membership } = await requireSalonAccess(salonId);
  const salon = Array.isArray(membership.salons) ? membership.salons[0] : membership.salons;
  const links = [
    { href: `/app/salons/${salonId}`, label: "Dashboard" },
    { href: `/app/salons/${salonId}/appointments`, label: "Appointments" },
    { href: `/app/salons/${salonId}/customers`, label: "Customers" },
    { href: `/app/salons/${salonId}/staff`, label: "Staff" },
    { href: `/app/salons/${salonId}/services`, label: "Services" },
    { href: `/app/salons/${salonId}/hours`, label: "Hours" },
  ];
  if (canViewRevenue(role)) {
    links.push({ href: `/app/salons/${salonId}/payments`, label: "Payments" });
  }
  if (canManageSalonSettings(role)) {
    links.push({ href: `/app/salons/${salonId}/settings`, label: "Settings" });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Salon · {role}</p>
        <h1 className="font-serif text-3xl">{salon?.name}</h1>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border px-3 py-1 text-muted hover:border-gold hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
