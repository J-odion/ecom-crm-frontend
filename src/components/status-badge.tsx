import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  new: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/15 text-primary border-primary/30",
  assigned: "bg-primary/15 text-primary border-primary/30",
  out_for_delivery: "bg-warning/20 text-warning-foreground border-warning/40",
  in_progress: "bg-warning/20 text-warning-foreground border-warning/40",
  delivered: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  cash_remitted: "bg-success/20 text-success border-success/40",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  discrepancy: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const k = (status || "pending").toLowerCase().replace(/\s+/g, "_");
  const cls = map[k] || "bg-muted text-muted-foreground";
  const label = (status || "pending").replace(/_/g, " ");
  return (
    <Badge variant="outline" className={cn("capitalize border", cls)}>
      {label}
    </Badge>
  );
}
