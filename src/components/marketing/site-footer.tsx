import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>© {BRAND_NAME}. Premium salon operations.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
