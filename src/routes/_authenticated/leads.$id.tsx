import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallButton, WhatsAppButton, CopyOrderButton } from "@/components/contact-buttons";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "Lead details — Ecom CRM" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => (await api.get(`/leads/${id}`)).data,
  });
  const lead: any = data?.data || data || {};

  const [form, setForm] = useState({
    quantity: 1,
    amount: "",
    address: "",
    delivery_type: "in_house",
    notes: "",
  });

  const schedule = useMutation({
    mutationFn: async () =>
      (await api.post("/orders", {
        leadId: id,
        customerName: lead.customerName || lead.name,
        phone: lead.phone,
        product: lead.product,
        productName: lead.product,
        quantity: Number(form.quantity),
        amount: form.amount ? Number(form.amount) : undefined,
        address: form.address,
        deliveryType: form.delivery_type,
        delivery_type: form.delivery_type,
        status: "scheduled",
        notes: form.notes,
      })).data,
    onSuccess: () => {
      toast.success("Order scheduled");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      navigate({ to: "/orders" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to schedule"),
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
      <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate({ to: "/leads" })}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to leads
      </Button>
      <PageHeader
        title={lead.customerName || lead.name || `Lead #${String(id).slice(-6)}`}
        description={lead.product}
        actions={<StatusBadge status={lead.status} />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail k="Phone" v={lead.phone} />
            <Detail k="Email" v={lead.email} />
            <Detail k="Source" v={lead.source} />
            <Detail k="Product" v={lead.product} />
            <div className="flex flex-wrap gap-2 pt-2">
              <CallButton phone={lead.phone} />
              <WhatsAppButton phone={lead.phone} />
              <CopyOrderButton order={lead} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Schedule order</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity">
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </Field>
              <Field label="Order amount (₦)">
                <Input type="number" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Delivery type" className="sm:col-span-2">
                <Select value={form.delivery_type} onValueChange={(v) => setForm({ ...form, delivery_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_house">In-house</SelectItem>
                    <SelectItem value="third_party">Third-party</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Delivery address" className="sm:col-span-2">
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, landmark…" />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
            </div>
            <Button onClick={() => schedule.mutate()} disabled={schedule.isPending}>
              {schedule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule order
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
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
