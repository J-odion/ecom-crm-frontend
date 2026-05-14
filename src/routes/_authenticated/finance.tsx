import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Wallet, TrendingUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Finance — Ecom CRM" }] }),
  component: FinancePage,
});

function FinancePage() {
  const profitQ = useQuery({
    queryKey: ["finance-profit"],
    queryFn: async () => (await api.get("/finance/profit")).data,
  });
  const data: any = profitQ.data || {};
  const revenue = data.revenue ?? data.totalRevenue ?? 0;
  const profit = data.profit ?? data.totalProfit ?? 0;
  const cost = data.cost ?? data.totalCost ?? 0;

  const [userId, setUserId] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const walletQ = useQuery({
    queryKey: ["wallet", submittedId],
    queryFn: async () => (await api.get(`/finance/wallet/${submittedId}`)).data,
    enabled: !!submittedId,
  });

  return (
    <div>
      <PageHeader title="Finance" description="System-wide revenue, profit and wallet lookups." />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Revenue" value={`₦${Number(revenue).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Cost" value={`₦${Number(cost).toLocaleString()}`} icon={Wallet} accent="warning" />
        <StatCard label="Profit" value={`₦${Number(profit).toLocaleString()}`} icon={Wallet} accent="success" />
      </div>

      <Card>
        <CardHeader><CardTitle>Wallet lookup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-1.5 block">User ID</Label>
              <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="60d0fe4f5311236168a109ca" />
            </div>
            <div className="flex items-end">
              <Button onClick={() => setSubmittedId(userId)} disabled={!userId}>Look up</Button>
            </div>
          </div>
          {submittedId && (
            walletQ.isLoading ? (
              <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</div>
            ) : walletQ.error ? (
              <p className="text-sm text-destructive">Wallet not found.</p>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Balance</p>
                <p className="mt-1 text-2xl font-semibold">₦{Number(walletQ.data?.balance ?? walletQ.data?.amount ?? 0).toLocaleString()}</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
