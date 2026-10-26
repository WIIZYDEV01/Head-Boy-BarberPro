import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-20">
      <h1 className="font-serif text-4xl">Page not found</h1>
      <p className="mt-3 text-sm text-muted">That route does not exist, or the salon is not published.</p>
      <Button asChild className="mt-6 w-fit">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
