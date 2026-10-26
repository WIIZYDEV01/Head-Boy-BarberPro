"use client";

import { Button } from "@/components/ui/button";

export default function Error({
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
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-3xl">That screen hit an error</h1>
      <p className="mt-3 text-sm text-muted">{error.message || "Reload and try once more."}</p>
      <Button className="mt-6" onClick={() => (again ? again() : window.location.reload())}>
        Try again
      </Button>
    </div>
  );
}
