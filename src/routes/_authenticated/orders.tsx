import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ShoppingCart, Loader2, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders — Ecom CRM" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const setDelivery = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/orders/${id}/delivery-status`, { status })).data,
    onSuccess: () => {
      toast.success("Order delivery status updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update"),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/orders/${id}/cancel`, {})).data,
    onSuccess: () => {
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to cancel"),
  });

  if (user?.role === "sales_agent" || user?.role === "media_buyer") {
    return <UnauthorizedView />;
  }
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data,
  });
  const orders: any[] = Array.isArray(data) ? data : data?.data || [];
  const filtered = orders.filter((o) =>
    JSON.stringify(o).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader title="Orders" description="All orders across the system." />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Search orders…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="No orders" description="Orders will show up here once Customer Service schedules them." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, i) => {
                    const id = o._id || o.id || i;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link to="/orders/$id" params={{ id: String(id) }} className="text-primary hover:underline">
                            #{String(id).slice(-6)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{o.customerName || o.customer_name || "—"}</td>
                        <td className="px-4 py-3">{o.product || o.productName || "—"}</td>
                        <td className="px-4 py-3">{o.amount ? `₦${Number(o.amount).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status || o.deliveryStatus} /></td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDelivery.mutate({ id: String(id), status: "pending" })}>
                                Mark Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDelivery.mutate({ id: String(id), status: "delivered" })}>
                                Mark Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => cancel.mutate(String(id))}>
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
  );
}
