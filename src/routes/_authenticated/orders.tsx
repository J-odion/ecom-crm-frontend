import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders — Ecom CRM" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const [q, setQ] = useState("");
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
