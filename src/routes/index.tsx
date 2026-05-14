import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;

  const roleRedirects: Record<string, string> = {
    sales_agent: "/media-buyer",
    customer_service: "/leads",
    logistics: "/deliveries",
    delivery_agent: "/deliveries",
    accountant: "/accountant",
    admin: "/dashboard",
  };

  const to = (user?.role && roleRedirects[user.role]) || "/dashboard";
  return <Navigate to={to} />;
}
