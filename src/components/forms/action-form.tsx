"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving…",
  submitClassName,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  submitClassName?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className={cn("relative space-y-4", pending && "pointer-events-none opacity-70")}>
      {children}
      {state?.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
      <Button type="submit" disabled={pending} className={submitClassName}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
