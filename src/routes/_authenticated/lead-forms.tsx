import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layout,
  Plus,
  Loader2,
  Trash2,
  Copy,
  ExternalLink,
  Code2,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/role-gate";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";

export const Route = createFileRoute("/_authenticated/lead-forms")({
  head: () => ({ meta: [{ title: "Lead Forms — Ecom CRM" }] }),
  component: LeadFormsPage,
});

function LeadFormsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  if (user?.role === "customer_service") {
    return <UnauthorizedView />;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["lead-forms"],
    queryFn: async () => (await apiActions.leadForms.list()).data,
  });

  const forms: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Forms"
        description="Create and manage embeddable forms for your landing pages."
        actions={
          <RoleGate allowedRoles={["admin"]}>
            <Button asChild>
              <Link to="/lead-forms/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Link>
            </Button>
          </RoleGate>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/50">
              <div className="h-40" />
            </Card>
          ))
        ) : forms.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Layout}
              title="No forms yet"
              description="Create your first embeddable form to start capturing leads."
            />
          </div>
        ) : (
          forms.map((form) => (
            <FormCard key={form.id || form._id} form={form} />
          ))
        )}
      </div>
    </div>
  );
}

function FormCard({ form }: { form: any }) {
  const qc = useQueryClient();
  const [showCode, setShowCode] = useState(false);
  const iframeUrl = apiActions.leadForms.getIframe(form.id || form._id);
  const iframeCode = `<iframe src="${iframeUrl}" width="100%" height="600" frameborder="0" style="border:none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;

  const deleteMutation = useMutation({
    mutationFn: () => apiActions.leadForms.delete(form.id || form._id),
    onSuccess: () => {
      toast.success("Form deleted");
      qc.invalidateQueries({ queryKey: ["lead-forms"] });
    },
    onError: (err: any) => toast.error(err.friendlyMessage || "Failed to delete"),
  });

  const copyCode = () => {
    navigator.clipboard.writeText(iframeCode);
    toast.success("Iframe code copied to clipboard");
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: form.buttonColor || "var(--primary)" }}
          >
            <Layout className="h-5 w-5" />
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              asChild
            >
              <a href={iframeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <RoleGate allowedRoles={["admin"]}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this form?")) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </RoleGate>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <CardTitle className="text-base">{form.title || form.name || "Untitled Form"}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Product: <span className="text-foreground font-medium">{form.productId?.name || form.productName || "—"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Attributed Buyer: <span className="text-foreground font-medium">{form.sourceMediaBuyerId?.fullName || form.sourceMediaBuyerId?.name || form.mediaBuyerName || "System"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Default Source: <span className="text-foreground font-semibold text-indigo-600">{form.defaultSource || "FACEBOOK"}</span>
          </p>
          <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t mt-2">
            <span className="text-muted-foreground">Order Count:</span>
            <span>{form.orderCount || form.leadsCount || 0}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Form Earnings:</span>
            <span className="text-emerald-600">₦{Number(form.earnings || 0).toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-3 pt-0">
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Palette className="h-3 w-3" />
            {form.buttonColor || "Default"}
          </div>
          <div className="h-1 w-1 rounded-full bg-border" />
          <div className="text-muted-foreground">
            {form.buttonText || "Order Now"}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setShowCode(true)}
          >
            <Code2 className="h-3.5 w-3.5 mr-1.5" />
            Get Code
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            onClick={copyCode}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </Button>
        </div>
      </CardContent>

      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Embed Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Paste this iframe code into your landing page or website to display the form.
            </p>
            <div className="relative group">
              <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed border border-border">
                {iframeCode}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={copyCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <Palette className="h-4 w-4 shrink-0" />
              <span>
                The form will automatically capture leads and assign them to Media Buyer 
                <strong> {form.mediaBuyerName}</strong> for tracking.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCode(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

