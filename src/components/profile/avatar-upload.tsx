"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { removeAvatarAction, uploadAvatarAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AvatarUpload({
  name,
  currentUrl,
  size = "lg",
}: {
  name: string;
  currentUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if (result?.error) setError(result.error);
      else setSuccess(result?.success ?? "Photo updated.");
    });
  }

  function onRemove() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (result?.error) setError(result.error);
      else setSuccess(result?.success ?? "Photo removed.");
    });
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
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
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
            {pending ? "Uploading…" : currentUrl ? "Change photo" : "Upload photo"}
          </Button>
          {currentUrl ? (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted">JPEG, PNG, or WebP · 2MB max</p>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onChange}
      />
    </div>
  );
}
