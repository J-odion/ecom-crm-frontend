import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function UnauthorizedView() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh] bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">Access Denied</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        You do not have the required permissions to view customer profiles, leads, or orders. 
        Please contact system support if you believe this is an error.
      </p>
      <Button asChild className="shadow-sm">
        <Link to="/">Go back to Dashboard</Link>
      </Button>
    </div>
  );
}
