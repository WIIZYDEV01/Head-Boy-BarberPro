import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_SHORT } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-serif text-xl tracking-tight text-gold">
          {BRAND_SHORT}
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/salons" className="hover:text-foreground">
            Salons
          </Link>
          <Link href="/#services" className="hover:text-foreground">
            Services
          </Link>
          <Link href="/#team" className="hover:text-foreground">
            Team
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </nav>
        <Button asChild>
            <Link href="/app">Dashboard</Link>
        </Button>
      </div>
    </header>
  );
}
