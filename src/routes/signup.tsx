import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Ecom CRM" }] }),
  component: SignupPage,
});

const FUNNEL = [
  { icon: Megaphone, label: "Ad Spend", sub: "Media buyers log daily spend", value: "1,240", tint: "var(--chart-1)" },
  { icon: Users, label: "Leads", sub: "Captured & assigned to CS", value: "842", tint: "var(--chart-2)" },
  { icon: PhoneCall, label: "Confirmed", sub: "CS schedules the order", value: "611", tint: "var(--chart-3)" },
  { icon: Truck, label: "Out for Delivery", sub: "Logistics dispatch", value: "498", tint: "var(--chart-4)" },
  { icon: Wallet, label: "Cash Remitted", sub: "Accountant verifies", value: "412", tint: "var(--chart-5)" },
];

type Stage = "form" | "verify" | "success";

interface PwChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
}

function evaluatePassword(pw: string): { score: number; checks: PwChecks } {
  const checks: PwChecks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length; // 0..5
  return { score, checks };
}

const STRENGTH_META = [
  { label: "Too weak", color: "var(--destructive)" },
  { label: "Weak", color: "var(--destructive)" },
  { label: "Fair", color: "var(--chart-4)" },
  { label: "Good", color: "var(--chart-2)" },
  { label: "Strong", color: "var(--chart-2)" },
  { label: "Excellent", color: "var(--primary)" },
];

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const { score, checks } = useMemo(() => evaluatePassword(password), [password]);

  const errors = useMemo(() => {
    const e: { name?: string; email?: string; password?: string; confirm?: string } = {};
    if (!name.trim()) e.name = "Please enter your full name";
    else if (name.trim().length < 2) e.name = "Name is too short";

    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";

    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Use at least 8 characters";
    else if (score < 3) e.password = "Make your password stronger";

    if (!confirm) e.confirm = "Please confirm your password";
    else if (confirm !== password) e.confirm = "Passwords don't match";
    return e;
  }, [name, email, password, confirm, score]);

  const isValid = Object.keys(errors).length === 0;

  const showErr = (k: keyof typeof errors) => touched[k] && errors[k];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!isValid) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password);
      // After successful signup, route to email verification step.
      setStage("verify");
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      toast.success(`Verification email re-sent to ${email}`);
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const onVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp(email, otpCode);
      setStage("success");
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Invalid or expired code");
    } finally {
      setVerifying(false);
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
            Join the workspace built for every role in your funnel.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
            Media buyers, customer service, logistics, and accountants — all
            collaborating on the same orders, with the right permissions out of the box.
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

      {/* RIGHT — dynamic stage */}
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

          {/* Stepper */}
          <div className="mb-8 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {(["form", "verify", "success"] as Stage[]).map((s, i) => {
              const active = stage === s;
              const done =
                (s === "form" && stage !== "form") ||
                (s === "verify" && stage === "success");
              return (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                          ? "border-primary text-primary"
                          : "border-border"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className={active ? "text-foreground" : ""}>
                    {s === "form" ? "Account" : s === "verify" ? "Verify" : "Done"}
                  </span>
                  {i < 2 && <span className="h-px w-4 bg-border" />}
                </div>
              );
            })}
          </div>

          {stage === "form" && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
                <p className="text-sm text-muted-foreground">
                  Get access to the EcomCRM workspace.
                </p>
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Jane Doe"
                    autoComplete="name"
                    aria-invalid={!!showErr("name")}
                  />
                  {showErr("name") && (
                    <p className="text-[12px] text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@company.com"
                    autoComplete="email"
                    aria-invalid={!!showErr("email")}
                  />
                  {showErr("email") && (
                    <p className="text-[12px] text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!showErr("password")}
                  />

                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full bg-muted transition-colors"
                            style={
                              i < score
                                ? { background: STRENGTH_META[score].color }
                                : undefined
                            }
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className="font-medium"
                          style={{ color: STRENGTH_META[score].color }}
                        >
                          {STRENGTH_META[score].label}
                        </span>
                        <span className="text-muted-foreground">{score}/5</span>
                      </div>
                      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {[
                          { k: "length", t: "8+ characters" },
                          { k: "upper", t: "Uppercase letter" },
                          { k: "lower", t: "Lowercase letter" },
                          { k: "number", t: "Number" },
                          { k: "symbol", t: "Symbol" },
                        ].map(({ k, t }) => {
                          const ok = checks[k as keyof PwChecks];
                          return (
                            <li key={k} className="flex items-center gap-1.5">
                              {ok ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <X className="h-3 w-3 opacity-40" />
                              )}
                              <span className={ok ? "text-foreground" : ""}>{t}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {showErr("password") && (
                    <p className="text-[12px] text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!showErr("confirm")}
                  />
                  {showErr("confirm") && (
                    <p className="text-[12px] text-destructive">{errors.confirm}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading} size="lg">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>

              <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Role-based access</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {stage === "verify" && (
            <div className="space-y-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                }}
              >
                <Mail className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">Verify your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a confirmation link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  Open it to activate your account.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    For your security, your account stays inactive until the email
                    is verified. The link expires in 24 hours.
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification Code</Label>
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={() => onVerify()}
                  >
                    <InputOTPGroup className="w-full justify-between">
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-[11px] text-muted-foreground">
                    Check your email console for the 6-digit verification code.
                  </p>
                </div>

                <Button onClick={() => onVerify()} className="w-full" size="lg" disabled={verifying || otpCode.length < 6}>
                  {verifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Verify account
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onResend}
                  disabled={resending}
                >
                  {resending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Resend code
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Wrong address?{" "}
                <button
                  type="button"
                  onClick={() => setStage("form")}
                  className="font-medium text-primary hover:underline"
                >
                  Edit details
                </button>
              </p>
            </div>
          )}

          {stage === "success" && (
            <div className="space-y-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "color-mix(in oklab, var(--primary) 16%, transparent)",
                  color: "var(--primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Welcome aboard{name ? `, ${name.split(" ")[0]}` : ""} 🎉
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your workspace is ready. Here's how to get the most out of EcomCRM in
                  the first few minutes.
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  {
                    icon: Users,
                    title: "Invite your team",
                    sub: "Add CS agents, logistics, and accountants with the right roles.",
                  },
                  {
                    icon: Package,
                    title: "Set up your products",
                    sub: "Import your catalog so leads can be converted to orders.",
                  },
                  {
                    icon: Megaphone,
                    title: "Connect your ad spend",
                    sub: "Media buyers can start logging daily spend right away.",
                  },
                ].map(({ icon: I, title, sub }) => (
                  <li
                    key={title}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      <I className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  Go to dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate({ to: "/users" })}
                >
                  Invite teammates
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
