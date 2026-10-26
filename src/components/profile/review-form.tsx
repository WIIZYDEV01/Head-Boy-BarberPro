"use client";

import { submitReviewAction } from "@/app/actions/profile";
import { ActionForm } from "@/components/forms/action-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  return (
    <ActionForm action={submitReviewAction} submitLabel="Leave rating" pendingLabel="Saving…">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <div className="space-y-2">
        <Label htmlFor={`rating-${appointmentId}`}>How was the cut?</Label>
        <select
          id={`rating-${appointmentId}`}
          name="rating"
          defaultValue="5"
          className="h-10 w-full rounded-md border border-border bg-card px-3"
        >
          <option value="5">5 · Perfect</option>
          <option value="4">4 · Great</option>
          <option value="3">3 · Fine</option>
          <option value="2">2 · Off</option>
          <option value="1">1 · Poor</option>
        </select>
      </div>
      <Textarea name="comment" placeholder="Optional note for the shop" />
    </ActionForm>
  );
}