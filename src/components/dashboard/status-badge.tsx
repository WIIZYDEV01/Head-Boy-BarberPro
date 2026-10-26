import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending_payment: { label: "Pending payment", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  no_show: { label: "No-show", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
  success: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  abandoned: { label: "Abandoned", variant: "secondary" },
  refunded: { label: "Refunded", variant: "secondary" },
};

export function StatusBadge({ status }: { status: string }) {
  const item = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
