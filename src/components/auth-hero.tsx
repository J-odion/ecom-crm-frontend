import {
  Megaphone,
  PhoneCall,
  Truck,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Users,
  Package,
} from "lucide-react";

const FUNNEL = [
  { icon: Megaphone, label: "Ad Spend", sub: "Media buyers log daily spend", value: "1,240", tint: "var(--chart-1)" },
  { icon: Users, label: "Leads", sub: "Captured & assigned to CS", value: "842", tint: "var(--chart-2)" },
  { icon: PhoneCall, label: "Confirmed", sub: "CS schedules the order", value: "611", tint: "var(--chart-3)" },
  { icon: Truck, label: "Out for Delivery", sub: "Logistics dispatch", value: "498", tint: "var(--chart-4)" },
  { icon: Wallet, label: "Cash Remitted", sub: "Accountant verifies", value: "412", tint: "var(--chart-5)" },
];

export function AuthHero() {
  return (
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
  );
}
