import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden p-4">
      {/* Background glowing effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

      {/* Animated 404 SVG Illustration */}
      <div className="relative w-64 h-64 mb-6">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-[bounce_4s_ease-in-out_infinite]">
          {/* Ufo Dome */}
          <path d="M150 180C150 140 180 110 200 110C220 110 250 140 250 180" fill="currentColor" className="text-primary/20" />
          <path d="M150 180C150 140 180 110 200 110C220 110 250 140 250 180" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary/60" />
          
          {/* Alien / 404 Character inside */}
          <circle cx="200" cy="155" r="15" fill="currentColor" className="text-primary" />
          <path d="M190 150C190 150 195 145 200 145C205 145 210 150 210 150" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-background" />
          
          {/* Ufo Base */}
          <ellipse cx="200" cy="180" rx="80" ry="25" fill="currentColor" className="text-muted" />
          <ellipse cx="200" cy="180" rx="80" ry="25" stroke="currentColor" strokeWidth="8" className="text-primary/80" />
          
          {/* Ufo Lights */}
          <circle cx="145" cy="180" r="5" fill="currentColor" className="text-primary animate-pulse" />
          <circle cx="170" cy="188" r="5" fill="currentColor" className="text-primary animate-pulse" style={{ animationDelay: "200ms" }} />
          <circle cx="200" cy="192" r="5" fill="currentColor" className="text-primary animate-pulse" style={{ animationDelay: "400ms" }} />
          <circle cx="230" cy="188" r="5" fill="currentColor" className="text-primary animate-pulse" style={{ animationDelay: "600ms" }} />
          <circle cx="255" cy="180" r="5" fill="currentColor" className="text-primary animate-pulse" style={{ animationDelay: "800ms" }} />
          
          {/* Abduction Beam */}
          <path d="M160 200L120 320H280L240 200" fill="currentColor" className="text-primary/10" />
          <path d="M160 200L120 320H280L240 200" stroke="currentColor" strokeWidth="4" strokeDasharray="10 10" strokeLinecap="round" className="text-primary/30 animate-[spin_10s_linear_infinite]" />
          
          {/* The missing "404" text floating away */}
          <text x="185" y="270" fontSize="32" fontWeight="bold" fill="currentColor" className="text-primary/80" style={{ transformOrigin: "center", transform: "rotate(-10deg)" }}>4</text>
          <text x="215" y="285" fontSize="24" fontWeight="bold" fill="currentColor" className="text-primary/50" style={{ transformOrigin: "center", transform: "rotate(15deg)" }}>0</text>
          <text x="240" y="260" fontSize="28" fontWeight="bold" fill="currentColor" className="text-primary/70" style={{ transformOrigin: "center", transform: "rotate(-5deg)" }}>4</text>

          {/* Stars */}
          <circle cx="80" cy="80" r="3" fill="currentColor" className="text-primary/40 animate-ping" />
          <circle cx="320" cy="120" r="4" fill="currentColor" className="text-primary/40 animate-ping" style={{ animationDelay: "1s" }} />
          <circle cx="100" cy="250" r="2" fill="currentColor" className="text-primary/40 animate-ping" style={{ animationDelay: "2s" }} />
        </svg>
      </div>

      <div className="max-w-md text-center z-10">
        <h1 className="text-6xl font-black tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent mb-2">
          Oops!
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          This page got abducted.
        </h2>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">
          We can't seem to find the page you're looking for. It might have been moved, deleted, or possibly abducted by aliens.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Beam me home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ecom CRM — Operations Suite" },
      { name: "description", content: "Role-based e-commerce CRM for sales, logistics, accounting and management." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
