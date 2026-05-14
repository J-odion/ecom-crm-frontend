import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

// DEV BYPASS — set to false to re-enable the real auth guard.
// Lets you browse every authenticated page without signing in while iterating on UI.
const BYPASS_AUTH = false;

function AuthLayout() {
  const { isAuthenticated } = useAuth();
  // Avoid SSR/hydration mismatch — wait until client mounts to read localStorage
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }
  if (!BYPASS_AUTH && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <AppShell />;
}
