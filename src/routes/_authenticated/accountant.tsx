import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ReceiptText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/stat-card";

export const Route = createFileRoute("/_authenticated/accountant")({
  head: () => ({ meta: [{ title: "Remittance — Ecom CRM" }] }),
  component: AccountantPage,
});

function AccountantPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data,
  });
  const orders: any[] = Array.isArray(data) ? data : data?.data || [];

  const delivered = orders.filter((o) => /deliver/i.test(o.status || ""));
  const pendingRemit = delivered.filter((o) => !/cash_remitted|completed/i.test(o.status || ""));
  const remitted = delivered.filter((o) => /cash_remitted|completed/i.test(o.status || ""));
  const expectedCash = pendingRemit.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  const mut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/orders/${id}/payment-status`, { status })).data,
    onSuccess: () => {
      toast.success("Payment status updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <div>
      <PageHeader title="Cash remittance" description="Confirm cash from delivered orders." />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Pending remittance" value={pendingRemit.length} accent="warning" />
        <StatCard label="Cash expected" value={`₦${expectedCash.toLocaleString()}`} accent="primary" />
        <StatCard label="Remitted" value={remitted.length} accent="success" />
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
          ) : pendingRemit.length === 0 ? (
            <EmptyState icon={ReceiptText} title="All caught up" description="No pending remittances right now." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Delivery fee</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRemit.map((o, i) => {
                    const id = o._id || o.id || i;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link to="/orders/$id" params={{ id: String(id) }} className="text-primary hover:underline">#{String(id).slice(-6)}</Link>
                        </td>
                        <td className="px-4 py-3">{o.customerName || o.customer_name || "—"}</td>
                        <td className="px-4 py-3">{o.amount ? `₦${Number(o.amount).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3">{o.delivery_fee ? `₦${Number(o.delivery_fee).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1.5">
                            <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate({ id: String(id), status: "cash_remitted" })}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" disabled={mut.isPending} onClick={() => mut.mutate({ id: String(id), status: "discrepancy" })}>
                              Flag
                            </Button>
                          </div>
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
