import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useQuery } from "@tanstack/react-query";
import { api, ROLE_LABEL } from "@/lib/api";
import { ShoppingCart, Truck, Wallet, Target, Megaphone, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ecom CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const ordersQ = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data,
  });
  const profitQ = useQuery({
    queryKey: ["finance-profit"],
    queryFn: async () => (await api.get("/finance/profit")).data,
    enabled: user?.role === "admin" || user?.role === "accountant",
    retry: false,
  });
  const perfQ = useQuery({
    queryKey: ["mb-performance", "weekly"],
    queryFn: async () =>
      (await api.get("/media-buyers/performance", { params: { range: "weekly" } })).data,
    enabled: user?.role === "sales_agent" || user?.role === "admin",
    retry: false,
  });

  const orders: any[] = Array.isArray(ordersQ.data) ? ordersQ.data : ordersQ.data?.data || [];
  const total = orders.length;
  const delivered = orders.filter((o) => /deliver/i.test(o.status || o.deliveryStatus || "")).length;
  const pending = orders.filter((o) => /(pending|scheduled|assigned|new)/i.test(o.status || "")).length;
  const failed = orders.filter((o) => /(failed|cancelled)/i.test(o.status || "")).length;

  const profit = profitQ.data?.profit ?? profitQ.data?.totalProfit ?? profitQ.data?.total ?? null;
  const revenue = profitQ.data?.revenue ?? profitQ.data?.totalRevenue ?? null;
  const dr = perfQ.data?.deliveryRate ?? perfQ.data?.delivery_rate ?? null;
  const cpa = perfQ.data?.cpa ?? perfQ.data?.CPA ?? null;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.email?.split("@")[0] || "there"}`}
        description={`Signed in as ${user?.role ? ROLE_LABEL[user.role] : ""}. Here's what's happening today.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={total} icon={ShoppingCart} />
        <StatCard label="Delivered" value={delivered} icon={Truck} accent="success" />
        <StatCard label="In Progress" value={pending} icon={Package} accent="warning" />
        <StatCard label="Failed / Cancelled" value={failed} icon={Target} accent="destructive" />
        <RoleGate allowedRoles={["admin", "accountant"]}>
          <StatCard
            label="Revenue"
            value={revenue !== null ? `₦${Number(revenue).toLocaleString()}` : "—"}
            icon={Wallet}
          />
          <StatCard
            label="Profit"
            value={profit !== null ? `₦${Number(profit).toLocaleString()}` : "—"}
            icon={Wallet}
            accent="success"
          />
        </RoleGate>
        <RoleGate allowedRoles={["sales_agent", "admin"]}>
          <StatCard
            label="Delivery Rate"
            value={dr !== null ? `${Number(dr).toFixed(1)}%` : "—"}
            icon={Megaphone}
            accent="success"
            hint="Last 7 days"
          />
          <StatCard
            label="CPA"
            value={cpa !== null ? `₦${Number(cpa).toLocaleString()}` : "—"}
            icon={Megaphone}
            hint="Cost per acquisition"
          />
        </RoleGate>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {orders.slice(0, 6).map((o, i) => (
                  <li key={o._id || o.id || i} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {o.customerName || o.customer_name || o.product || `Order #${(o._id || o.id || "").toString().slice(-6)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {o.product || o.productName || "—"} · {o.amount ? `₦${Number(o.amount).toLocaleString()}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={o.status || o.deliveryStatus} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {user?.role === "customer_service" && (
              <Button asChild variant="secondary"><Link to="/leads">Process leads</Link></Button>
            )}
            {user?.role === "logistics" && (
              <Button asChild variant="secondary"><Link to="/deliveries">Manage deliveries</Link></Button>
            )}
            {user?.role === "delivery_agent" && (
              <Button asChild variant="secondary"><Link to="/deliveries">My deliveries</Link></Button>
            )}
            {user?.role === "accountant" && (
              <Button asChild variant="secondary"><Link to="/accountant">Confirm remittance</Link></Button>
            )}
            {user?.role === "sales_agent" && (
              <Button asChild variant="secondary"><Link to="/media-buyer">Log ad spend</Link></Button>
            )}
            {user?.role === "admin" && (
              <>
                <Button asChild variant="secondary"><Link to="/users">Manage users</Link></Button>
                <Button asChild variant="secondary"><Link to="/commission-rules">Commission rules</Link></Button>
              </>
            )}
            <Button asChild variant="outline"><Link to="/orders">Browse orders</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
