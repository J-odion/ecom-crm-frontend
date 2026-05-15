import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { AuthHero } from "@/components/auth-hero";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Ecom CRM" }] }),
  component: ForgotPasswordPage,
});

type Stage = "request" | "reset" | "success";

function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Recovery code sent to your email");
      setStage("reset");
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Failed to send recovery code");
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error("Please enter the 6-digit recovery code");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, code, newPassword: password });
      toast.success("Password reset successfully");
      setStage("success");
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Invalid code or reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1.15fr_1fr]">
      <AuthHero />

      {/* RIGHT — form */}
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

          {stage === "request" && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">Forgot password?</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a 6-digit recovery code.
                </p>
              </div>

              <form onSubmit={onRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !email} size="lg">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send recovery code
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {stage === "reset" && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">Reset your password</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
                </p>
              </div>

              <form onSubmit={onReset} className="space-y-4">
                <div className="space-y-2">
                  <Label>Recovery Code</Label>
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={setCode}
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || code.length < 6 || !password} size="lg">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset password
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setStage("request")}
                className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary"
              >
                <RefreshCw className="h-3 w-3" />
                Try a different email
              </button>
            </div>
          )}

          {stage === "success" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success shadow-lg shadow-success/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">Password reset!</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link to="/login">
                  Sign in to your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
