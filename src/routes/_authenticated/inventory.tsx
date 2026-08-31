import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { Boxes, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Ecom CRM" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => (await api.get("/inventory/products")).data,
  });
  const items: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock levels and product catalogue."
        actions={
          <div className="flex gap-2">
            <StockTransferDialog items={items} onDone={() => qc.invalidateQueries({ queryKey: ["inventory-products"] })} />
            <StockInDialog items={items} onDone={() => qc.invalidateQueries({ queryKey: ["inventory-products"] })} />
            <NewProductDialog endpoint="/inventory/products" onDone={() => qc.invalidateQueries({ queryKey: ["inventory-products"] })} />
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Boxes} title="No products yet" description="Add your first product to start tracking stock." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Cost</th>
                    <th className="px-4 py-3 text-left">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={p._id || p.id || i} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.name || p.productName || "—"}</td>
                      <td className="px-4 py-3">{p.stock ?? p.quantity ?? "—"}</td>
                      <td className="px-4 py-3">{p.cost ? `₦${Number(p.cost).toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3">{p.price ? `₦${Number(p.price).toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function NewProductDialog({
  endpoint,
  onDone,
  triggerLabel = "Add product",
}: {
  endpoint: string;
  onDone: () => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", baseCost: "", sellingPrice: "", description: "" });
  const create = useMutation({
    mutationFn: async () =>
      (await api.post(endpoint, {
        name: form.name,
        baseCost: form.baseCost ? Number(form.baseCost) : undefined,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : undefined,
        description: form.description || undefined,
      })).data,
    onSuccess: () => {
      toast.success("Product created");
      setOpen(false);
      setForm({ name: "", baseCost: "", sellingPrice: "", description: "" });
      onDone();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label className="mb-1.5 block">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Base Cost (₦)</Label><Input type="number" value={form.baseCost} onChange={(e) => setForm({ ...form, baseCost: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Selling Price (₦)</Label><Input type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label className="mb-1.5 block">Description (Optional)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StockInDialog({ items, onDone }: { items: any[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", locationId: "", quantity: 0, notes: "" });

  const { data: locData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await api.get("/locations")).data,
  });
  const locations: any[] = Array.isArray(locData) ? locData : locData?.data || [];

  const mut = useMutation({
    mutationFn: async () => (await api.post("/inventory/in", form)).data,
    onSuccess: () => {
      toast.success("Stock updated");
      setOpen(false);
      setForm({ productId: "", locationId: "", quantity: 0, notes: "" });
      onDone();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Stock In</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Stock In</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Product</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.productId} 
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select product...</option>
              {items.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name || p.productName}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block">Location</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.locationId} 
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            >
              <option value="">Select location...</option>
              {locations.map(l => <option key={l._id || l.id} value={l._id || l.id}>{l.name}</option>)}
            </select>
          </div>
          <div><Label className="mb-1.5 block">Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
          <div><Label className="mb-1.5 block">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!form.productId || !form.locationId || !form.quantity || mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StockTransferDialog({ items, onDone }: { items: any[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", fromLocationId: "", toLocationId: "", quantity: 0, notes: "" });

  const { data: locData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await api.get("/locations")).data,
  });
  const locations: any[] = Array.isArray(locData) ? locData : locData?.data || [];

  const mut = useMutation({
    mutationFn: async () => (await api.post("/inventory/transfer", form)).data,
    onSuccess: () => {
      toast.success("Transfer recorded");
      setOpen(false);
      setForm({ productId: "", fromLocationId: "", toLocationId: "", quantity: 0, notes: "" });
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e.friendlyMessage || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline">Transfer</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Transfer Stock</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Product</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={form.productId} 
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select product...</option>
              {items.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name || p.productName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1.5 block">From Location</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.fromLocationId} 
                onChange={(e) => setForm({ ...form, fromLocationId: e.target.value })}
              >
                <option value="">Select location...</option>
                {locations.map(l => <option key={l._id || l.id} value={l._id || l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">To Location</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.toLocationId} 
                onChange={(e) => setForm({ ...form, toLocationId: e.target.value })}
              >
                <option value="">Select location...</option>
                {locations.map(l => <option key={l._id || l.id} value={l._id || l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div><Label className="mb-1.5 block">Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
          <div><Label className="mb-1.5 block">Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!form.productId || !form.fromLocationId || !form.toLocationId || !form.quantity || mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
