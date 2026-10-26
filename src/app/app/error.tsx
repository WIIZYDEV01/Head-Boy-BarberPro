"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const again = retry ?? reset;
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="font-serif text-3xl">Dashboard error</h1>
      <p className="mt-3 text-sm text-muted">{error.message || "Reload this page and try again."}</p>
      <Button className="mt-6" onClick={() => (again ? again() : window.location.reload())}>
        Try again
      </Button>
    </div>
  );
}
