import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function UnauthorizedView() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[70vh] bg-background/50 rounded-xl border border-border/40 shadow-sm m-6 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-destructive/5 rounded-full blur-3xl -z-10" />
      
      {/* Animated SVG Illustration */}
      <div className="relative w-48 h-48 mb-8 text-muted-foreground/20">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Shield Background */}
          <path d="M100 20L30 50V90C30 140 60 170 100 190C140 170 170 140 170 90V50L100 20Z" fill="currentColor" className="text-destructive/5" />
          <path d="M100 20L30 50V90C30 140 60 170 100 190C140 170 170 140 170 90V50L100 20Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-destructive/20" />
          
          {/* Lock Body */}
          <rect x="70" y="90" width="60" height="50" rx="8" fill="currentColor" className="text-destructive/40" />
          <rect x="70" y="90" width="60" height="50" rx="8" stroke="currentColor" strokeWidth="4" className="text-destructive/60" />
          
          {/* Lock Shackle (Animated) */}
          <path d="M75 90V75C75 61.1929 86.1929 50 100 50C113.807 50 125 61.1929 125 75V80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-destructive/60 origin-[125px_80px] animate-[bounce_3s_ease-in-out_infinite]" />
          
          {/* Keyhole */}
          <circle cx="100" cy="110" r="6" fill="currentColor" className="text-background" />
          <path d="M96 112L94 125H106L104 112Z" fill="currentColor" className="text-background" />
          
          {/* Alert lines */}
          <path d="M40 90H20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-destructive/30 animate-pulse" />
          <path d="M180 90H160" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-destructive/30 animate-pulse" />
          <path d="M100 10V0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-destructive/30 animate-pulse" />
        </svg>
      </div>

      <h3 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
        Access Restricted
      </h3>
      <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
        You don't have the necessary permissions to view this page or perform this action. 
        If you believe this is a mistake, please reach out to your system administrator.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline" className="shadow-sm px-6">
          <button onClick={() => window.history.back()}>Go Back</button>
        </Button>
        <Button asChild className="shadow-sm px-6">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
