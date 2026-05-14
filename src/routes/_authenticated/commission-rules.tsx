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
                    <p className="font-medium">{r.name || `Rule ${i + 1}`}</p>
                    <p className="text-xs text-muted-foreground">{r.role || r.appliesTo || "—"} · {r.type || "fixed"}</p>
                  </div>
                  <p className="font-semibold text-primary">{r.percentage ? `${r.percentage}%` : r.amount ? `₦${Number(r.amount).toLocaleString()}` : "—"}</p>
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
  const [form, setForm] = useState({ name: "", role: "sales_agent", type: "percentage", percentage: "", amount: "", description: "" });
  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/commission-rules", {
        name: form.name,
        role: form.role,
        type: form.type,
        percentage: form.percentage ? Number(form.percentage) : undefined,
        amount: form.amount ? Number(form.amount) : undefined,
        description: form.description || undefined,
      })).data,
    onSuccess: () => {
      toast.success("Rule created");
      setOpen(false);
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>New rule</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New commission rule</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label className="mb-1.5 block">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Percentage</Label><Input type="number" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">Fixed amount (₦)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label className="mb-1.5 block">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
