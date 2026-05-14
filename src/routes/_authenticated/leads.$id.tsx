import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
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
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  UserCheck,
  History,
  ShieldAlert,
  Info,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";

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
    queryFn: async () => (await apiActions.leads.get(id)).data,
  });
  const lead: any = data?.data || data || {};

  const [form, setForm] = useState({
    quantity: 1,
    amount: "",
    address: "",
    delivery_type: "in_house",
    notes: "",
  });

  useEffect(() => {
    if (lead) {
      setForm((f) => ({
        ...f,
        address: lead.address || lead.deliveryAddress || f.address,
        amount: lead.amount || lead.orderAmount || f.amount,
      }));
    }
  }, [lead]);

  const schedule = useMutation({
    mutationFn: async () =>
      (
        await apiActions.orders.create({
          leadId: id,
          customerName: lead.customerName || lead.name,
          phone: lead.phone,
          product: lead.productName || lead.product,
          productName: lead.productName || lead.product,
          quantity: Number(form.quantity),
          amount: form.amount ? Number(form.amount) : undefined,
          address: form.address,
          deliveryType: form.delivery_type,
          status: "scheduled",
          notes: form.notes,
        })
      ).data,
    onSuccess: () => {
      toast.success("Order scheduled successfully");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      navigate({ to: "/orders" });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to schedule"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2"
        onClick={() => navigate({ to: "/leads" })}
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to leads
      </Button>

      {/* Identity Alerts */}
      {(lead.isDuplicate || lead.isReturning) && (
        <div className="flex flex-col gap-3">
          {lead.isDuplicate && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/50">
                <ShieldAlert className="h-5 w-5 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">Potential Duplicate Submission</p>
                <p className="text-xs text-amber-800/80">
                  A lead with phone number <strong>{lead.phone}</strong> already exists and is currently open. 
                  Please verify before scheduling.
                </p>
              </div>
            </div>
          )}
          {lead.isReturning && (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-200/50">
                <UserCheck className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">Returning Customer</p>
                <p className="text-xs text-emerald-800/80">
                  This customer has successfully received <strong>{lead.pastOrdersCount || 1}</strong> orders in the past. 
                  Prioritize this lead!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <PageHeader
        title={lead.customerName || lead.name || `Lead #${String(id).slice(-6)}`}
        description={`${lead.productName || lead.product} — Captured via ${lead.source || "Direct"}`}
        actions={<StatusBadge status={lead.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" /> Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Detail k="Phone" v={lead.phone} />
              <Detail k="Email" v={lead.email} />
              <Detail k="Location" v={lead.city || lead.state || "—"} />
              <Detail k="Submission" v={`${lead.submissionCount || 1} times`} />
              <div className="flex flex-wrap gap-2 pt-2 border-t pt-4">
                <CallButton phone={lead.phone} />
                <WhatsAppButton phone={lead.phone} />
                <CopyOrderButton order={lead} />
              </div>
            </CardContent>
          </Card>

          {lead.relatedLeadIds?.length > 0 && (
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-800">
                  <History className="h-4 w-4" /> Lead History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lead.relatedLeadIds.map((rid: string) => (
                    <li key={rid}>
                      <Link
                        to="/leads/$id"
                        params={{ id: rid }}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        <AlertCircle className="h-3 w-3" />
                        View submission from {new Date().toLocaleDateString()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-2 shadow-glow border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" /> Schedule Final Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Order Quantity">
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="h-11"
                />
              </Field>
              <Field label="Total Order Amount (₦)">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 25,000"
                  className="h-11"
                />
              </Field>
              <Field label="Delivery Logistics" className="sm:col-span-2">
                <Select
                  value={form.delivery_type}
                  onValueChange={(v) => setForm({ ...form, delivery_type: v })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_house">In-house (Lagos/Abuja)</SelectItem>
                    <SelectItem value="third_party">Third-party (GIGL/Others)</SelectItem>
                    <SelectItem value="express">Express Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fulfillment Address" className="sm:col-span-2">
                <Textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Detailed house address, closest landmark, and city..."
                  className="min-h-[100px] resize-none"
                />
              </Field>
              <Field label="Internal Dispatch Notes" className="sm:col-span-2">
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any special instructions for the logistics team?"
                  className="min-h-[80px] resize-none"
                />
              </Field>
            </div>
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold shadow-glow transition-all hover:scale-[1.01]"
              onClick={() => schedule.mutate()}
              disabled={schedule.isPending}
            >
              {schedule.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                "Confirm & Schedule Dispatch"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Detail({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="text-sm font-medium text-foreground">{v ?? "—"}</span>
    </div>
  );
}
