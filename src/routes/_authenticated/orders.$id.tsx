import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { CallButton, WhatsAppButton, CopyOrderButton } from "@/components/contact-buttons";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { OrderStatusTimeline } from "@/components/order-status-timeline";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order details — Ecom CRM" }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [fee, setFee] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
  });
  const order: any = data?.data || data || {};

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["order", id] });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["deliveries"] });
  };

  const setDelivery = useMutation({
    mutationFn: async (status: "delivered" | "failed") =>
      (await api.patch(`/orders/${id}/delivery-status`, {
        status,
        delivery_fee: fee ? Number(fee) : undefined,
      })).data,
    onSuccess: (_d, status) => {
      toast.success(`Marked ${status}`);
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update"),
  });

  const remit = useMutation({
    mutationFn: async (status: "cash_remitted" | "discrepancy") =>
      (await api.patch(`/orders/${id}/payment-status`, { status })).data,
    onSuccess: () => {
      toast.success("Payment status updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  const cancel = useMutation({
    mutationFn: async () => (await api.patch(`/orders/${id}/cancel`, {})).data,
    onSuccess: () => {
      toast.success("Order cancelled");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate({ to: "/orders" })}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <PageHeader
        title={`Order #${String(order._id || order.id || id).slice(-6)}`}
        description={order.product || order.productName}
        actions={<StatusBadge status={order.status || order.deliveryStatus} />}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <OrderStatusTimeline currentStatus={order.status || order.deliveryStatus} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail k="Name" v={order.customerName || order.customer_name} />
            <Detail k="Phone" v={order.phone || order.customerPhone} />
            <Detail k="Address" v={order.address || order.deliveryAddress} />
            <Detail k="Product" v={order.product || order.productName} />
            <Detail k="Quantity" v={order.quantity ?? order.qty ?? 1} />
            <Detail k="Amount" v={order.amount ? `₦${Number(order.amount).toLocaleString()}` : "—"} />
            <Detail k="Delivery type" v={order.deliveryType || order.delivery_type} />
            <Detail k="Delivery fee" v={order.delivery_fee ? `₦${Number(order.delivery_fee).toLocaleString()}` : "—"} />
            <Detail k="Notes" v={order.notes} />
            <div className="flex flex-wrap gap-2 pt-2">
              <CallButton phone={order.phone || order.customerPhone} />
              <WhatsAppButton phone={order.phone || order.customerPhone} />
              <CopyOrderButton order={order} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <RoleGate allowedRoles={["logistics", "delivery_agent", "admin"]}>
            <Card>
              <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fee">Delivery fee (₦)</Label>
                  <Input id="fee" type="number" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" />
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setDelivery.mutate("delivered")} disabled={setDelivery.isPending} className="bg-success hover:bg-success/90 text-success-foreground">
                    Mark Delivered
                  </Button>
                  <Button variant="destructive" onClick={() => setDelivery.mutate("failed")} disabled={setDelivery.isPending}>
                    Mark Failed
                  </Button>
                </div>
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate allowedRoles={["accountant", "admin"]}>
            <Card>
              <CardHeader><CardTitle>Remittance</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button onClick={() => remit.mutate("cash_remitted")} disabled={remit.isPending}>Confirm cash remitted</Button>
                <Button variant="outline" onClick={() => remit.mutate("discrepancy")} disabled={remit.isPending}>
                  Flag discrepancy
                </Button>
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate allowedRoles={["customer_service", "admin"]}>
            <Card>
              <CardHeader><CardTitle>Manage</CardTitle></CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
                  Cancel order (RTS)
                </Button>
              </CardContent>
            </Card>
          </RoleGate>
        </div>
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: any }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="col-span-2 text-foreground">{v ?? "—"}</span>
    </div>
  );
}
