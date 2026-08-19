import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useQuery } from "@tanstack/react-query";
import { apiActions, ROLE_LABEL, type Role } from "@/lib/api";
import {
  ShoppingCart,
  Truck,
  Wallet,
  Target,
  Megaphone,
  Package,
  Activity,
  Users,
  Compass,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ecom CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const currentRole = user?.role || "sales_agent";

  // Unified Dashboard Endpoint
  const { data: meDashboardData, isLoading } = useQuery({
    queryKey: ["analytics-me", currentRole],
    queryFn: async () => (await apiActions.analytics.me()).data,
  });

  // Recent Orders for CS, Logistics, Admin
  const showOrdersList =
    currentRole !== "sales_agent" && currentRole !== "media_buyer";

  const ordersQ = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => (await apiActions.orders.list()).data,
    enabled: showOrdersList,
  });

  const orders: any[] = Array.isArray(ordersQ.data)
    ? ordersQ.data
    : ordersQ.data?.data || [];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        <Activity className="h-6 w-6 animate-spin mr-2" />
        Loading analytics dashboard...
      </div>
    );
  }

  const data = meDashboardData || {};
  const performance = data.performance || {};
  const metrics = data.metrics || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.fullName || user?.email?.split("@")[0] || "there"}`}
        description={`Signed in as ${user?.role ? ROLE_LABEL[user.role] : ""}. Here's your performance snapshot.`}
      />

      {/* RENDER ADMIN / GENERAL MANAGER DASHBOARD */}
      {(currentRole === "admin" || currentRole === "manager") && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={`₦${Number(data.revenue || 0).toLocaleString()}`}
              icon={Wallet}
              accent="primary"
            />
            <StatCard
              label="Ad Spend"
              value={`₦${Number(data.adSpend || 0).toLocaleString()}`}
              icon={Megaphone}
              accent="warning"
            />
            <StatCard
              label="Delivery Cost"
              value={`₦${Number(data.deliveryCost || 0).toLocaleString()}`}
              icon={Truck}
              accent="primary"
            />
            <StatCard
              label="Net Profit"
              value={`₦${Number(data.profit || 0).toLocaleString()}`}
              icon={TrendingUp}
              accent="success"
            />
            <StatCard
              label="Product Cost (COGS)"
              value={`₦${Number(data.productCost || 0).toLocaleString()}`}
              icon={Package}
            />
            <StatCard
              label="Total Paid Commissions"
              value={`₦${Number(data.commission || 0).toLocaleString()}`}
              icon={DollarSign}
              accent="success"
            />
            <StatCard
              label="Total Orders Count"
              value={metrics.totalOrders ?? 0}
              icon={ShoppingCart}
            />
            <StatCard
              label="System Delivery Rate"
              value={`${Number(metrics.deliveryRate || 0).toFixed(1)}%`}
              icon={Target}
              accent="success"
            />
          </div>

          {/* ACTIVE STAFF ONLINE SECTION */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Staff Online
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time list of all staff members currently online.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(!data.onlineUsers || data.onlineUsers.length === 0) ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No staff members are currently online.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground text-[10px] uppercase">
                      <tr>
                        <th className="px-6 py-2.5 text-left">Name</th>
                        <th className="px-6 py-2.5 text-left">Email</th>
                        <th className="px-6 py-2.5 text-left">Role</th>
                        <th className="px-6 py-2.5 text-left">Office / Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.onlineUsers.map((onlineUser: any) => (
                        <tr
                          key={onlineUser.userId || onlineUser._id}
                          className="border-b border-border/50 hover:bg-muted/20"
                        >
                          <td className="px-6 py-3 font-medium text-foreground">
                            {onlineUser.fullName}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {onlineUser.email}
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary uppercase">
                              {ROLE_LABEL[onlineUser.role as Role] || onlineUser.role}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {onlineUser.locationName || "Remote / Unassigned"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* RENDER CUSTOMER SERVICE AGENT DASHBOARD */}
      {(currentRole === "customer_service" || currentRole === "customer_service_manager") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today's Deliveries"
            value={performance.todayDeliveries ?? 0}
            icon={Truck}
            accent="success"
          />
          <StatCard
            label="Today's Follow-Up Orders"
            value={performance.todayFollowUpOrders ?? 0}
            icon={Activity}
            accent="warning"
          />
          <StatCard
            label="Weekly Deliveries Completed"
            value={performance.metrics?.weeklyDelivery ?? performance.weeklyDelivery ?? 0}
            icon={ShoppingCart}
          />
          <StatCard
            label="Weekly Processed Leads"
            value={performance.metrics?.weeklyProcessed ?? performance.weeklyProcessed ?? 0}
            icon={Package}
          />
          <StatCard
            label="CS Quality Rating"
            value={`${Number(performance.rating || 0).toFixed(1)}%`}
            icon={Target}
            accent="success"
            hint="Calculated from weekly processing"
          />
          <StatCard
            label="CS Wallet Commission"
            value={`₦${Number(performance.earnings || 0).toLocaleString()}`}
            icon={Wallet}
            accent="success"
          />
        </div>
      )}

      {/* RENDER MEDIA BUYER / SALES AGENT DASHBOARD */}
      {(currentRole === "media_buyer" || currentRole === "sales_agent") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ad Spend (Spent)"
            value={`₦${Number(performance.totalSpent || 0).toLocaleString()}`}
            icon={Megaphone}
            accent="warning"
          />
          <StatCard
            label="Amount Received"
            value={`₦${Number(performance.totalReceived || 0).toLocaleString()}`}
            icon={DollarSign}
            accent="success"
          />
          <StatCard
            label="Ad Wallet Balance"
            value={`₦${Number(performance.balance || 0).toLocaleString()}`}
            icon={Wallet}
            accent={performance.balance >= 0 ? "success" : "destructive"}
          />
          <StatCard
            label="Leads Generated"
            value={performance.leadsGenerated ?? 0}
            icon={Activity}
          />
          <StatCard
            label="Scheduled Orders"
            value={performance.scheduledOrders ?? 0}
            icon={ShoppingCart}
          />
          <StatCard
            label="Delivered Orders"
            value={performance.deliveredOrders ?? 0}
            icon={Truck}
            accent="success"
          />
          <StatCard
            label="Ad Conversion Delivery Rate"
            value={`${Number(performance.deliveryRate || 0).toFixed(1)}%`}
            icon={Target}
            accent="success"
          />
          <StatCard
            label="Average CPA"
            value={`₦${Number(performance.cpa || 0).toLocaleString()}`}
            icon={Compass}
          />
          <StatCard
            label="My Earnings (Commissions)"
            value={`₦${Number(performance.earnings || 0).toLocaleString()}`}
            icon={Wallet}
            accent="success"
            hint="Direct revenue commission"
          />
        </div>
      )}

      {/* RENDER LOGISTICS AGENT DASHBOARD */}
      {currentRole === "logistics" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today Assigned Shipments"
            value={performance.todayAssigned ?? 0}
            icon={Package}
            accent="warning"
          />
          <StatCard
            label="Today Completed Deliveries"
            value={performance.todayCompleted ?? 0}
            icon={Truck}
            accent="success"
          />
          <StatCard
            label="Weekly Completed"
            value={performance.weeklyCompleted ?? 0}
            icon={ShoppingCart}
          />
          <StatCard
            label="Weekly Failed / Delayed"
            value={performance.weeklyFailed ?? 0}
            icon={AlertCircle}
            accent="destructive"
          />
          <StatCard
            label="On-Time Delivery Rate"
            value={`${Number(performance.deliveryRate || 0).toFixed(1)}%`}
            icon={Target}
            accent="success"
          />
          <StatCard
            label="Total Courier Earnings"
            value={`₦${Number(performance.earnings || 0).toLocaleString()}`}
            icon={Wallet}
            accent="success"
          />
        </div>
      )}

      {/* RENDER TEAM MANAGER DASHBOARD VIEW */}
      {(currentRole === "customer_service_manager" ||
        currentRole === "logistics_manager" ||
        currentRole === "hr" ||
        currentRole === "admin" ||
        currentRole === "marketing_manager") && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Staff Performance Overview
              </CardTitle>
              <CardDescription>
                Real-time tracking of staff members assigned to your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(!data.team || data.team.length === 0) ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No team members assigned to your manager account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left">Member Name</th>
                        <th className="px-6 py-3 text-left">Role</th>
                        <th className="px-6 py-3 text-left">Status</th>
                        <th className="px-6 py-3 text-center">Orders Count</th>
                        <th className="px-6 py-3 text-center">Delivery Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.team.map((member: any) => {
                        const count =
                          member.orderCount ??
                          member.performance?.deliveredOrders ??
                          member.performance?.weeklyCompleted ??
                          member.performance?.weeklyProcessed ??
                          0;
                        const rate =
                          member.deliveryRate ??
                          member.performance?.deliveryRate ??
                          member.performance?.rating ??
                          0;

                        return (
                          <tr
                            key={member.userId || member._id}
                            className="border-b border-border/50 hover:bg-muted/20"
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {member.fullName || member.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {member.email}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {ROLE_LABEL[member.role as Role] || member.role}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  member.isOnline
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-slate-500/10 text-slate-500"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    member.isOnline ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                />
                                {member.isOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-medium">
                              {count}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                              {Number(rate).toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* QUICK ACTIONS & LISTINGS SECTION */}
      <div className="grid gap-4 lg:grid-cols-3">
        {showOrdersList ? (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/orders">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {ordersQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading recent orders…</p>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {orders.slice(0, 6).map((o, i) => (
                    <li
                      key={o._id || o.id || i}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {o.customerName || o.customer_name || "Guest Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {o.product || o.productName || "—"} ·{" "}
                          {o.amount ? `₦${Number(o.amount).toLocaleString()}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={o.status || o.deliveryStatus} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary animate-none" /> Ad Campaign Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                As a Media Buyer, your customer database access is disabled to protect client privacy.
                You can record your ad campaigns spend and analyze lead attribution metrics.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="secondary" className="text-xs">
                  <Link to="/media-buyer">Log Daily Spend</Link>
                </Button>
                <Button asChild variant="outline" className="text-xs">
                  <Link to="/lead-forms">Get Iframe Embed Codes</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(currentRole === "customer_service" || currentRole === "customer_service_manager") && (
              <Button asChild variant="secondary">
                <Link to="/orders">Process Leads & Orders</Link>
              </Button>
            )}
            {(currentRole === "logistics" || currentRole === "logistics_manager") && (
              <Button asChild variant="secondary">
                <Link to="/deliveries">Manage Deliveries</Link>
              </Button>
            )}
            {currentRole === "delivery_agent" && (
              <Button asChild variant="secondary">
                <Link to="/deliveries">My Deliveries</Link>
              </Button>
            )}
            {currentRole === "accountant" && (
              <Button asChild variant="secondary">
                <Link to="/accountant">Confirm Remittance</Link>
              </Button>
            )}
            {(currentRole === "sales_agent" || currentRole === "media_buyer") && (
              <Button asChild variant="secondary">
                <Link to="/media-buyer">Log Ad Spend</Link>
              </Button>
            )}
            {(currentRole === "admin" || currentRole === "dev") && (
              <>
                <Button asChild variant="secondary">
                  <Link to="/users">Manage Users</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/commission-rules">Commission Rules</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/audit-trail">Audit Trail Logs</Link>
                </Button>
              </>
            )}
            {showOrdersList && (
              <Button asChild variant="outline">
                <Link to="/orders">Browse Orders</Link>
              </Button>
            )}
            <Button asChild variant="ghost" className="text-xs text-muted-foreground">
              <Link to="/settings">Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
