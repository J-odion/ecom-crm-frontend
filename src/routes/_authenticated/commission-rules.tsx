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
import { Percent, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/commission-rules")({
  head: () => ({ meta: [{ title: "Commission Rules — Ecom CRM" }] }),
  component: CommissionRulesPage,
});

function CommissionRulesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["commission-rules"],
    queryFn: async () => (await api.get("/commission-rules")).data,
  });
  const rules: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div>
      <PageHeader
        title="Commission rules"
        description="Configure how commissions are calculated for each role."
        actions={<NewRuleDialog onDone={() => qc.invalidateQueries({ queryKey: ["commission-rules"] })} />}
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
          ) : rules.length === 0 ? (
            <EmptyState icon={Percent} title="No rules yet" description="Create your first commission rule." />
          ) : (
            <ul className="divide-y divide-border">
              {rules.map((r, i) => (
                <li key={r._id || r.id || i} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div>
                    <p className="font-medium">{r.name || r.ruleType || `Rule ${i + 1}`}</p>
                    <p className="text-xs text-muted-foreground">Roles: {(r.roles || []).join(", ") || r.role || "All"} · {r.amountType || r.type || "PERCENTAGE"}</p>
                  </div>
                  <p className="font-semibold text-primary">
                    {r.amountType === "FIXED" || r.type === "fixed" || r.amount 
                      ? `₦${Number(r.value || r.amount).toLocaleString()}` 
                      : `${r.value || r.percentage}%`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NewRuleDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ruleType: "GLOBAL", amountType: "PERCENTAGE", value: "", roles: [] as string[] });
  
  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/commission-rules", {
        ruleType: form.ruleType,
        amountType: form.amountType,
        value: Number(form.value) || 0,
        roles: form.roles,
      })).data,
    onSuccess: () => {
      toast.success("Rule created");
      setOpen(false);
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  const handleRoleToggle = (role: string) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New rule</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New commission rule</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Rule Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.ruleType}
                onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
              >
                <option value="GLOBAL">Global</option>
                <option value="PRODUCT_SPECIFIC">Product Specific</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Amount Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.amountType}
                onChange={(e) => setForm({ ...form, amountType: e.target.value })}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Value ({form.amountType === "PERCENTAGE" ? "%" : "₦"})</Label>
            <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div>
            <Label className="mb-2 block">Roles (Select multiple)</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
              {["sales_agent", "media_buyer", "customer_service", "logistics_manager", "delivery_agent", "accountant"].map(role => (
                <label key={role} className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={form.roles.includes(role)} 
                    onChange={() => handleRoleToggle(role)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>{role.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!form.value || form.roles.length === 0 || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

