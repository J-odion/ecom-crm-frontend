import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/media-buyer")({
  head: () => ({ meta: [{ title: "Media Buyer — Ecom CRM" }] }),
  component: MediaBuyerPage,
});

function MediaBuyerPage() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["mb-performance", range],
    queryFn: async () => (await api.get("/media-buyers/performance", { params: { range } })).data,
  });
  const perf: any = data || {};

  const leads = perf.leads ?? perf.leadsGenerated ?? 0;
  const scheduled = perf.scheduled ?? perf.ordersScheduled ?? 0;
  const delivered = perf.delivered ?? perf.ordersDelivered ?? 0;
  const spend = perf.adSpend ?? perf.spend ?? perf.amount_spent ?? 0;
  const dr = perf.deliveryRate ?? perf.delivery_rate ?? (scheduled ? (delivered / scheduled) * 100 : 0);
  const cpa = perf.cpa ?? perf.CPA ?? (delivered ? spend / delivered : 0);

  const series: any[] = perf.series || perf.history || perf.breakdown || [];

  return (
    <div>
      <PageHeader
        title="Media Buyer"
        description="Track ad spend, balance and conversion performance."
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Leads" value={leads} icon={Megaphone} />
        <StatCard label="Scheduled" value={scheduled} accent="warning" />
        <StatCard label="Delivered" value={delivered} accent="success" />
        <StatCard label="Ad Spend" value={`₦${Number(spend).toLocaleString()}`} />
        <StatCard label="Delivery Rate" value={`${Number(dr).toFixed(1)}%`} accent="success" />
        <StatCard label="CPA" value={`₦${Number(cpa).toLocaleString()}`} accent="primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Performance trend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
            ) : series.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No trend data yet.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="delivered" fill="oklch(0.62 0.20 258)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spend" fill="oklch(0.78 0.16 75)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <SpendLogCard onDone={() => qc.invalidateQueries({ queryKey: ["mb-performance"] })} />
      </div>
    </div>
  );
}

function SpendLogCard({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount_spent: "",
    amount_received: "",
    order_count: "",
    product_name: "",
    media_buyer_name: user?.fullName || user?.name || user?.email || "",
  });

  const spent = Number(form.amount_spent) || 0;
  const received = Number(form.amount_received) || 0;
  const orderCount = Number(form.order_count) || 0;
  const cpa = orderCount > 0 ? spent / orderCount : 0;
  const balance = received - spent;

  const log = useMutation({
    mutationFn: async () =>
      (await api.post("/media-buyers/spend-log", {
        date: form.date,
        media_buyer_name: form.media_buyer_name,
        amount_spent: spent,
        amount_received: received,
        order_count: orderCount,
        product_name: form.product_name,
        cpa: cpa,
        balance: balance,
      })).data,
    onSuccess: () => {
      toast.success("Spend log saved");
      setForm({ ...form, amount_spent: "", amount_received: "", order_count: "", product_name: "" });
      onDone();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed"),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Log Daily Spend</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="mb-1.5 block">Date</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1.5 block">Media Buyer Name</Label>
            <Input value={form.media_buyer_name} onChange={(e) => setForm({ ...form, media_buyer_name: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Product Name</Label>
            <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. Smart Watch" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1.5 block">Total Adspend (₦)</Label>
            <Input type="number" value={form.amount_spent} onChange={(e) => setForm({ ...form, amount_spent: e.target.value })} />
          </div>
          <div>
            <Label className="mb-1.5 block">Funds Received (₦)</Label>
            <Input type="number" value={form.amount_received} onChange={(e) => setForm({ ...form, amount_received: e.target.value })} />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Order Count</Label>
          <Input type="number" value={form.order_count} onChange={(e) => setForm({ ...form, order_count: e.target.value })} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4 rounded-md bg-muted/40 p-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Calculated CPA</div>
            <div className="font-semibold">₦{cpa.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Balance</div>
            <div className={balance >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>
              ₦{balance.toLocaleString()}
            </div>
          </div>
        </div>
        <Button onClick={() => log.mutate()} disabled={log.isPending} className="w-full mt-2">
          {log.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Log
        </Button>
      </CardContent>
    </Card>
  );
}
