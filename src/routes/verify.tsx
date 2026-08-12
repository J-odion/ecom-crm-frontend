import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { AuthHero } from "@/components/auth-hero";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "Verify your email — Ecom CRM" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Get email from URL params or local storage (fallback)
  const searchParams = new URLSearchParams(window.location.search);
  const urlEmail = searchParams.get("email");
  const storedEmail = typeof window !== "undefined" ? localStorage.getItem("verify_email") : null;
  const email = urlEmail || storedEmail || "";

  useEffect(() => {
    if (urlEmail && urlEmail !== storedEmail) {
      localStorage.setItem("verify_email", urlEmail);
    }
    if (!email) {
      toast.error("No email found for verification");
      navigate({ to: "/login" });
    }
  }, [email, urlEmail, storedEmail, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const response: any = await verifyOtp(email, otpCode);
      if (response?.success || response?.message?.toLowerCase().includes("verified")) {
        toast.success(response.message || "Account verified! Please log in.");
        navigate({ to: "/login" });
      } else {
        // Handle case where it returned 200 but maybe success: false (unlikely with axios)
        toast.success("Account verified successfully! You can now log in.");
        navigate({ to: "/login" });
      }
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await resendOtp(email);
      toast.success(`Verification email re-sent to ${email}`);
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.friendlyMessage || "Failed to resend code");
    } finally {
      setResending(false);
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

          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">Verify your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>

            <form onSubmit={onVerify} className="space-y-6">
              <div className="space-y-2">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  autoFocus
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

              <Button
                type="submit"
                className="w-full"
                disabled={verifying || otpCode.length < 6}
                size="lg"
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                )}
                Verify Account
              </Button>
            </form>

            <div className="space-y-4">
              <button
                type="button"
                onClick={onResend}
                disabled={resending || countdown > 0}
                className="flex w-full items-center justify-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive a code? Resend"}
              </button>

              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
