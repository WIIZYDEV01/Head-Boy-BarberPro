"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  avatarUrl,
}: {
  items: NavItem[];
  salonName?: string;
  userName?: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function Nav({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        <Link href="/app" className="font-serif text-xl text-gold" onClick={onNavigate}>
          {BRAND_SHORT}
        </Link>
        {salonName ? <p className="mt-2 text-xs uppercase tracking-wide text-muted">{salonName}</p> : null}
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-md px-3 py-3 text-base hover:bg-white/5 md:py-2 md:text-sm",
                pathname === item.href ? "bg-gold/15 text-gold" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border pt-4">
          <Link
            href="/app/profile"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-1 py-2 hover:bg-white/5"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-xs text-gold">
                {(userName ?? "A").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate text-sm">{userName}</span>
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" className="w-full" onClick={onNavigate}>
              Sign out
            </Button>
          </form>
        </div>
      </div>
    );
  }

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
          <Nav />
        )}
      </aside>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link href="/app" className="font-serif text-lg text-gold">
          {BRAND_SHORT}
        </Link>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="h-11 w-11" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <Nav onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
