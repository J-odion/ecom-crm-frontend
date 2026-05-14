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
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Cost</th>
                    <th className="px-4 py-3 text-left">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, i) => (
                    <tr key={p._id || p.id || i} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.name || p.productName || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.sku || "—"}</td>
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
  const [form, setForm] = useState({ name: "", sku: "", stock: 0, cost: "", price: "", description: "" });
  const create = useMutation({
    mutationFn: async () =>
      (await api.post(endpoint, {
        name: form.name,
        productName: form.name,
        sku: form.sku || undefined,
        stock: Number(form.stock) || 0,
        quantity: Number(form.stock) || 0,
        cost: form.cost ? Number(form.cost) : undefined,
        price: form.price ? Number(form.price) : undefined,
        description: form.description || undefined,
      })).data,
    onSuccess: () => {
      toast.success("Product created");
      setOpen(false);
      setForm({ name: "", sku: "", stock: 0, cost: "", price: "", description: "" });
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
          <div><Label className="mb-1.5 block">SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div><Label className="mb-1.5 block">Cost (₦)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Price (₦)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label className="mb-1.5 block">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
  const [form, setForm] = useState({ productId: "", quantity: 0, notes: "" });

  const mut = useMutation({
    mutationFn: async () => (await api.post("/inventory/in", form)).data,
    onSuccess: () => {
      toast.success("Stock updated");
      setOpen(false);
      setForm({ productId: "", quantity: 0, notes: "" });
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
          <div><Label className="mb-1.5 block">Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
          <div><Label className="mb-1.5 block">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!form.productId || !form.quantity || mut.isPending}>
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
  const [form, setForm] = useState({ productId: "", from: "", to: "", quantity: 0 });

  const mut = useMutation({
    mutationFn: async () => (await api.post("/inventory/transfer", form)).data,
    onSuccess: () => {
      toast.success("Transfer recorded");
      setOpen(false);
      setForm({ productId: "", from: "", to: "", quantity: 0 });
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
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
            <div><Label className="mb-1.5 block">From</Label><Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} placeholder="Warehouse A" /></div>
            <div><Label className="mb-1.5 block">To</Label><Input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="Warehouse B" /></div>
          </div>
          <div><Label className="mb-1.5 block">Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={!form.productId || !form.quantity || mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
