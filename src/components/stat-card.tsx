import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const accentMap = {
  primary: "from-primary/15 to-primary-glow/5 text-primary",
  success: "from-success/15 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
  destructive: "from-destructive/15 to-destructive/5 text-destructive",
};

export function StatCard({ label, value, hint, icon: Icon, accent = "primary", className }: Props) {
  return (
    <Card className={cn("overflow-hidden border-border/60 shadow-sm", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                accentMap[accent],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
