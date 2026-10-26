"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function shrinkPhoto(file: File): Promise<File> {
  if (file.size === 0) throw new Error("Choose a photo.");
  const bitmap = await createImageBitmap(file);
  const max = 640;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not compress that photo."))),
      "image/jpeg",
      0.8,
    );
  });
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export function AvatarUpload({
  name,
  currentUrl,
  size = "lg",
}: {
  name: string;
  currentUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const prepared = await shrinkPhoto(file);
      const formData = new FormData();
      formData.set("file", prepared);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const json = (await res.json().catch(() => ({}))) as { error?: string; success?: string; url?: string };
      if (!res.ok) throw new Error(json.error || "Photo upload failed.");
      if (json.url) setPreview(json.url);
      setSuccess(json.success ?? "Photo updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed. Try a smaller JPEG.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove() {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; success?: string };
      if (!res.ok) throw new Error(json.error || "Could not remove photo.");
      setPreview(null);
      setSuccess(json.success ?? "Photo removed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className={cn(
          "group relative overflow-hidden rounded-full border border-gold/40 bg-black/50",
          size === "lg" ? "h-28 w-28" : "h-12 w-12",
        )}
        aria-label="Change profile photo"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-serif text-2xl text-gold">
            {initials || "HB"}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
          <Camera className="h-5 w-5 text-gold" />
        </span>
      </button>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
            {pending ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview ? (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted">Phone photos are resized automatically. JPEG, PNG, or WebP.</p>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChange}
      />
    </div>
  );
}
