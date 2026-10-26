"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import { BRAND_SHORT } from "@/lib/brand";

export type NavItem = { href: string; label: string };

export function AppSidebar({
  items,
  salonName,
  userName,
}: {
  items: NavItem[];
  salonName?: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const nav = (
    <div className="flex h-full flex-col">
      <Link href="/app" className="font-serif text-xl text-gold">
        {BRAND_SHORT}
      </Link>
      {salonName ? <p className="mt-2 text-xs uppercase tracking-wide text-muted">{salonName}</p> : null}
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm hover:bg-white/5",
              pathname === item.href ? "bg-gold/15 text-gold" : "text-muted",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 border-t border-border pt-4">
        <p className="truncate text-sm">{userName}</p>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 border-r border-white/10 bg-black/70 p-4 md:sticky md:top-0 md:flex md:flex-col",
          collapsed ? "w-16 overflow-hidden" : "w-64",
        )}
      >
        <Button variant="ghost" size="sm" className="mb-4 self-end" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? "»" : "«"}
        </Button>
        {collapsed ? (
          <Link href="/app" className="text-gold">
            HB
          </Link>
        ) : (
          nav
        )}
      </aside>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link href="/app" className="font-serif text-lg text-gold">
          {BRAND_SHORT}
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>{nav}</SheetContent>
        </Sheet>
      </div>
    </>
  );
}
