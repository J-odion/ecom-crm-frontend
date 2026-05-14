import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Truck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/deliveries")({
  head: () => ({ meta: [{ title: "Deliveries — Ecom CRM" }] }),
  component: DeliveriesPage,
});

function DeliveriesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => (await api.get("/logistics/deliveries")).data,
  });
  const deliveries: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description={user?.role === "delivery_agent" ? "Your assigned deliveries." : "All deliveries across logistics."}
        actions={
          <RoleGate allowedRoles={["admin", "logistics"]}>
            <AssignDeliveryDialog onDone={() => qc.invalidateQueries({ queryKey: ["deliveries"] })} />
          </RoleGate>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : deliveries.length === 0 ? (
            <EmptyState icon={Truck} title="No deliveries" description="Assigned deliveries will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Delivery</th>
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d, i) => {
                    const id = d._id || d.id || i;
                    const orderId = d.orderId || d.order?._id || d.order?.id;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">#{String(id).slice(-6)}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {orderId ? (
                            <Link to="/orders/$id" params={{ id: String(orderId) }} className="text-primary hover:underline">
                              #{String(orderId).slice(-6)}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">{d.deliveryAgentEmail || d.deliveryAgent?.email || d.deliveryAgentId || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <UpdateDeliveryStatusDialog 
                            id={String(id)} 
                            currentStatus={d.status}
                            onDone={() => qc.invalidateQueries({ queryKey: ["deliveries"] })} 
                          />
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

function UpdateDeliveryStatusDialog({ id, currentStatus, onDone }: { id: string; currentStatus: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [fee, setFee] = useState("");
  const [status, setStatus] = useState<string>("");

  const update = useMutation({
    mutationFn: async () =>
      (await api.patch(`/logistics/deliveries/${id}/status`, { 
        status, 
        delivery_fee: Number(fee) || 0 
      })).data,
    onSuccess: () => {
      toast.success("Delivery status updated");
      setOpen(false);
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  const handleAction = (newStatus: string) => {
    setStatus(newStatus);
    setOpen(true);
  };

  return (
    <div className="inline-flex gap-1.5">
      <Dialog open={open} onOpenChange={setOpen}>
        <Button size="sm" variant="outline" onClick={() => handleAction("COMPLETED")}>
          Complete
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleAction("FAILED")}>
          Fail
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update delivery status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
              <span className="text-sm font-medium">New Status</span>
              <StatusBadge status={status} />
            </div>
            <div>
              <Label className="mb-1.5 block">Delivery Fee (₦)</Label>
              <Input 
                type="number" 
                value={fee} 
                onChange={(e) => setFee(e.target.value)} 
                placeholder="0.00"
                autoFocus
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Enter the final delivery cost for this order.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => update.mutate()} disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignDeliveryDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [agentId, setAgentId] = useState("");

  const assign = useMutation({
    mutationFn: async () =>
      (await api.post("/logistics/deliveries/assign", { orderId, deliveryAgentId: agentId })).data,
    onSuccess: () => {
      toast.success("Delivery assigned");
      setOpen(false);
      setOrderId("");
      setAgentId("");
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Assign delivery</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign order to delivery agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Order ID</Label>
            <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="60d0fe4f5311236168a109ca" />
          </div>
          <div>
            <Label className="mb-1.5 block">Delivery agent ID</Label>
            <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="60d0fe4f5311236168a109ca" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => assign.mutate()} disabled={!orderId || !agentId || assign.isPending}>
            {assign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
