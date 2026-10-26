"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleSavedSalonAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";

export function SaveSalonButton({ salonId, saved }: { salonId: string; saved: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        variant={saved ? "default" : "outline"}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleSavedSalonAction(salonId, saved);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <Heart className={saved ? "fill-current" : ""} />
        {pending ? "Saving…" : saved ? "Saved shop" : "Save shop"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
