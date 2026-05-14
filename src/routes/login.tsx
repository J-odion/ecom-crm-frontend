import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Megaphone,
  PhoneCall,
  ClipboardList,
  Truck,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Users,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Ecom CRM" }] }),
  component: LoginPage,
});

const FUNNEL = [
  { icon: Megaphone, label: "Ad Spend", sub: "Media buyers log daily spend", value: "1,240", tint: "var(--chart-1)" },
  { icon: Users, label: "Leads", sub: "Captured & assigned to CS", value: "842", tint: "var(--chart-2)" },
  { icon: PhoneCall, label: "Confirmed", sub: "CS schedules the order", value: "611", tint: "var(--chart-3)" },
  { icon: Truck, label: "Out for Delivery", sub: "Logistics dispatch", value: "498", tint: "var(--chart-4)" },
  { icon: Wallet, label: "Cash Remitted", sub: "Accountant verifies", value: "412", tint: "var(--chart-5)" },
];

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.15fr_1fr]">
      {/* LEFT — funnel / brand */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl font-bold shadow-lg"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              E
            </div>
            <span className="text-lg font-semibold tracking-tight">EcomCRM</span>
          </div>

          <h1 className="mt-14 max-w-md text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
            Run your entire e-commerce funnel from one workspace.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
            From ad spend to cash remittance — every role gets the view they need,
            every order gets the accountability it deserves.
          </p>
        </div>

        {/* Funnel */}
        <div className="relative mt-10 space-y-2.5">
          {FUNNEL.map((step, i) => {
            const Icon = step.icon;
            const widths = ["100%", "88%", "74%", "60%", "48%"];
            return (
              <div
                key={step.label}
                className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                style={{ width: widths[i] }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in oklab, ${step.tint} 35%, transparent)` }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium">{step.label}</p>
                      <span className="font-mono text-xs text-white/70">{step.value}</span>
                    </div>
                    <p className="truncate text-[11px] text-white/55">{step.sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          {[
            { icon: TrendingUp, k: "Delivery rate", v: "81.5%" },
            { icon: Package, k: "Avg. fulfillment", v: "1.6 d" },
            { icon: CheckCircle2, k: "Cash verified", v: "97%" },
          ].map(({ icon: I, k, v }) => (
            <div key={k} className="rounded-lg bg-white/5 p-3">
              <I className="h-4 w-4 text-white/70" />
              <p className="mt-2 text-base font-semibold">{v}</p>
              <p className="text-[11px] text-white/55">{k}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT — form */}
      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              E
            </div>
            <span className="text-base font-semibold">EcomCRM</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground">Min. 6 characters</span>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Role-based access</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to EcomCRM?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
