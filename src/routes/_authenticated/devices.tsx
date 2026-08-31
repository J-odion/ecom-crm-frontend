import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Laptop, Loader2, RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({ meta: [{ title: "Device Management — Ecom CRM" }] }),
  component: DevicesPage,
});

function DevicesPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Allow admin and management to see devices
  if (user?.role !== "admin" && user?.role !== "management" && user?.role !== "dev") {
    return <UnauthorizedView />;
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await apiActions.devices.list()).data,
  });

  const handleSync = async () => {
    try {
      setSyncing(true);
      await apiActions.devices.sync();
      toast.success("Sync triggered successfully. Devices will update shortly.");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["devices"] }), 2000);
    } catch (e: any) {
      toast.error(e.friendlyMessage || "Failed to sync devices");
    } finally {
      setSyncing(false);
    }
  };

  const devices: any[] = Array.isArray(data) ? data : data?.data || [];
  const filtered = devices.filter((d) =>
    JSON.stringify(d).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Device Management" description="Manage company devices and employee assignments." />
        <div className="flex gap-2">
          <AddDeviceDialog onDone={() => queryClient.invalidateQueries({ queryKey: ["devices"] })} />
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync with Fleet
          </Button>
        </div>
      </div>

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search devices by name, serial, type..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Laptop} title="No devices found" description="Click Sync with Fleet to import devices from your MDM." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type / OS</th>
                    <th className="px-4 py-3 text-left">Serial Number</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const id = d._id || d.id || i;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          <Link to="/devices/$id" params={{ id: String(id) }} className="text-primary hover:underline flex items-center">
                            <Laptop className="h-4 w-4 mr-2 text-muted-foreground" />
                            {d.name || "Unknown Device"}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {d.type} <span className="text-muted-foreground text-xs">({d.os || d.osVersion})</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{d.serialNumber || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "Never"}
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

export function AddDeviceDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    serialNumber: "",
    type: "LAPTOP",
    model: "",
    osVersion: "",
    costPrice: "",
    purchaseDate: "",
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/devices", {
        ...form,
        costPrice: Number(form.costPrice) || 0,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : new Date().toISOString(),
      })).data,
    onSuccess: () => {
      toast.success("Device added successfully");
      setOpen(false);
      setForm({
        name: "",
        serialNumber: "",
        type: "LAPTOP",
        model: "",
        osVersion: "",
        costPrice: "",
        purchaseDate: "",
      });
      onDone();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to add device"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Device</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Macbook Pro M3" />
          </div>
          <div className="grid gap-2">
            <Label>Serial Number</Label>
            <Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="C02..." />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="LAPTOP">Laptop</option>
              <option value="MOBILE_PHONE">Mobile Phone</option>
              <option value="ROUTER">Router</option>
              <option value="CAR">Car</option>
              <option value="BIKE">Bike</option>
              <option value="HEADPHONES">Headphones</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="14-inch 2023" />
            </div>
            <div className="grid gap-2">
              <Label>OS Version</Label>
              <Input value={form.osVersion} onChange={(e) => setForm({ ...form, osVersion: e.target.value })} placeholder="Sonoma 14.2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Cost Price (₦)</Label>
              <Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="1500000" />
            </div>
            <div className="grid gap-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!form.name || !form.serialNumber || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
