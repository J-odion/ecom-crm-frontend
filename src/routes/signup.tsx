import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  ClipboardList,
} from "lucide-react";
import { AuthHero } from "@/components/auth-hero";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Ecom CRM" }] }),
  component: SignupPage,
});

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
  const score = Object.values(checks).filter(Boolean).length;
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

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
      await signup(email, password, name);
      toast.success("Account created! Please verify your email.");
      navigate({ to: "/verify", search: { email } });
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.15fr_1fr]">
      <AuthHero />

      <section className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white shadow-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              E
            </div>
            <span className="text-base font-semibold tracking-tight">EcomCRM</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
            <p className="text-sm text-muted-foreground">
              Join the workspace and start managing your funnel.
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
        </div>
      </section>
    </div>
  );
}
