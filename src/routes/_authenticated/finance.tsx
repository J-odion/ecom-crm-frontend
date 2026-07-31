import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Wallet, TrendingUp, Loader2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ROLE_LABEL, type Role } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({ meta: [{ title: "Finance — Ecom CRM" }] }),
  component: FinancePage,
});

function FinancePage() {
  const qc = useQueryClient();
  const profitQ = useQuery({
    queryKey: ["finance-profit"],
    queryFn: async () => (await api.get("/finance/profit")).data,
  });
  const data: any = profitQ.data || {};
  const revenue = data.revenue ?? data.totalRevenue ?? 0;
  const profit = data.profit ?? data.totalProfit ?? 0;
  const cost = data.cost ?? data.totalCost ?? 0;

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });
  const users: any[] = Array.isArray(usersData) ? usersData : usersData?.data || [];

  const [userId, setUserId] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const walletQ = useQuery({
    queryKey: ["wallet", submittedId],
    queryFn: async () => (await api.get(`/finance/wallet/${submittedId}`)).data,
    enabled: !!submittedId,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" description="System-wide revenue, profit and wallet lookups." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue" value={`₦${Number(revenue).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Cost" value={`₦${Number(cost).toLocaleString()}`} icon={Wallet} accent="warning" />
        <StatCard label="Profit" value={`₦${Number(profit).toLocaleString()}`} icon={Wallet} accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Staff Salary Setup
            </CardTitle>
            <CardDescription>Configure base monthly salaries for staff members. Changes are reflected in their earnings dashboards.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading staff...
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No staff members found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Staff Name</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Base Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <SalaryRow key={u._id || u.id} user={u} onUpdate={() => qc.invalidateQueries({ queryKey: ["users"] })} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Wallet lookup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <div>
                <Label className="mb-1.5 block text-xs">User ID</Label>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="60d0fe4f5311236168a109ca" />
              </div>
              <Button onClick={() => setSubmittedId(userId)} disabled={!userId} className="w-full">Look up</Button>
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
    </div>
  );
}

function SalaryRow({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [salary, setSalary] = useState<string>(user.salary?.toString() || "0");

  const updateSalary = useMutation({
    mutationFn: async () =>
      (await api.patch(`/users/${user._id || user.id}`, { salary: Number(salary) })).data,
    onSuccess: () => {
      toast.success(`Salary updated for ${user.fullName}`);
      onUpdate();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to update salary"),
  });

  return (
    <tr className="border-b border-border/60 hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{user.fullName || "—"}</span>
          <span className="text-[10px] text-muted-foreground">{user.email}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {ROLE_LABEL[user.role as Role] || user.role}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">₦</span>
          <Input
            type="number"
            className="h-8 w-28 text-xs bg-background"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => updateSalary.mutate()}
            disabled={updateSalary.isPending}
          >
            {updateSalary.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      </td>
    </tr>
  );
}
