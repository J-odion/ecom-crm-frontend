import { CheckCircle2, Circle, Clock, Truck, Receipt, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "lead", label: "Lead", icon: Clock },
  { id: "scheduled", label: "Scheduled", icon: CheckCircle2 },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: Receipt },
  { id: "cash_remitted", label: "Cash Remitted", icon: CheckCircle2 },
];

interface OrderStatusTimelineProps {
  currentStatus: string;
  className?: string;
}

/**
 * Visual timeline for order status progression.
 */
export function OrderStatusTimeline({ currentStatus, className }: OrderStatusTimelineProps) {
  const status = (currentStatus || "").toLowerCase();
  
  // Map various status strings to our steps
  const statusMap: Record<string, number> = {
    "lead": 0,
    "new": 0,
    "scheduled": 1,
    "assigned": 1,
    "out_for_delivery": 2,
    "shipped": 2,
    "delivered": 3,
    "completed": 4,
    "cash_remitted": 4,
  };

  const currentIndex = statusMap[status] ?? -1;
  const isFailed = /fail|cancel/i.test(status);

  return (
    <div className={cn("relative flex w-full justify-between py-6", className)}>
      {/* Connector Line */}
      <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted" />
      <div 
        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500" 
        style={{ width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%` }}
      />

      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center group">
            <div 
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-colors duration-300",
                isCompleted ? "border-primary text-primary" : "border-muted text-muted-foreground",
                isActive && "ring-4 ring-primary/20 scale-110",
                isFailed && isActive && "border-destructive text-destructive ring-destructive/20"
              )}
            >
              {isFailed && isActive ? <XCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <span 
              className={cn(
                "absolute -bottom-6 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider transition-colors",
                isCompleted ? "text-primary" : "text-muted-foreground",
                isActive && "font-bold",
                isFailed && isActive && "text-destructive"
              )}
            >
              {isFailed && isActive ? "Failed" : step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
