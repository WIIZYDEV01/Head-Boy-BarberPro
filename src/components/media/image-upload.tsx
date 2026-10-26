"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function ImageUpload({
  salonId,
  folder,
  currentUrl,
  onUploaded,
}: {
  salonId: string;
  folder: "logos" | "barbers" | "services";
  currentUrl?: string | null;
  onUploaded: (url: string) => Promise<unknown>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Images must be 2MB or smaller.");
      return;
    }
    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const path = `${salonId}/${folder}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("salon-assets").upload(path, file, {
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("salon-assets").getPublicUrl(path);
      await onUploaded(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="h-20 w-20 rounded-md object-cover" />
      ) : null}
      <Button type="button" variant="secondary" asChild>
        <label>
          {pending ? "Uploading…" : "Upload image"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onChange} />
        </label>
      </Button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
