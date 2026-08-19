import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { toast } from "sonner";
import { apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  ClipboardList,
  Loader2,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — Ecom CRM" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  if (user?.role === "sales_agent" || user?.role === "media_buyer") {
    return <UnauthorizedView />;
  }
  const [filter, setFilter] = useState({
    isDuplicate: false,
    isReturning: false,
    status: [] as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", filter],
    queryFn: async () =>
      (
        await apiActions.leads.list({
          isDuplicate: filter.isDuplicate || undefined,
          isReturning: filter.isReturning || undefined,
        })
      ).data,
  });


  const leads: any[] = Array.isArray(data) ? data : data?.data || [];

  const archive = useMutation({
    mutationFn: async (id: string) => (await apiActions.leads.updateStatus(id, "CANCELLED")).data,
    onSuccess: () => {
      toast.success("Lead archived");
      qc.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLead(null);
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to archive"),
  });

  const confirm = useMutation({
    mutationFn: async (lead: any) =>
      (
        await apiActions.orders.create({
          leadId: lead._id || lead.id,
          customerName: lead.customerName || lead.name,
          phone: lead.phone,
          product: lead.productName || lead.product,
          productName: lead.productName || lead.product,
          quantity: 1,
          address: lead.address || lead.deliveryAddress || "",
          deliveryType: "in_house",
          status: "scheduled",
          notes: "Confirmed from leads quick view",
        })
      ).data,
    onSuccess: () => {
      toast.success("Lead confirmed and moved to orders");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setSelectedLead(null);
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to confirm lead"),
  });

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      (l.customerName || l.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.phone || "").includes(search);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Inbound leads ready for contact and scheduling."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or phone..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filter.isDuplicate}
                  onCheckedChange={(v) => setFilter({ ...filter, isDuplicate: v })}
                >
                  Duplicate leads
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter.isReturning}
                  onCheckedChange={(v) => setFilter({ ...filter, isReturning: v })}
                >
                  Returning customers
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No leads found"
              description="Try adjusting your filters or search query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Product / Source</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tags</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l, i) => {
                    const id = l._id || l.id || i;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {l.customerName || l.name || "—"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{l.phone || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm">{l.productName || l.product || "—"}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {l.source || "Direct"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {l.isDuplicate && (
                              <Badge variant="outline" className="h-5 gap-1 border-amber-200 bg-amber-50 text-amber-700">
                                <AlertCircle className="h-3 w-3" />
                                Duplicate
                              </Badge>
                            )}
                            {l.isReturning && (
                              <Badge variant="outline" className="h-5 gap-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                                <UserCheck className="h-3 w-3" />
                                Returning
                              </Badge>
                            )}
                            {l.submissionCount > 1 && (
                              <Badge 
                                variant="outline" 
                                className="h-5 gap-1 border-blue-200 bg-blue-50 text-blue-700 cursor-help"
                                title={`User has submitted this form ${l.submissionCount} times`}
                              >
                                <Hash className="h-3 w-3" />
                                {l.submissionCount}x
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedLead(l)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead Actions</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Name:</span>
                  <span className="font-medium">{selectedLead.customerName || selectedLead.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Phone:</span>
                  <span className="font-medium">{selectedLead.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Product:</span>
                  <span className="font-medium">{selectedLead.productName || selectedLead.product || "—"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                <CallButton phone={selectedLead.phone} />
                <WhatsAppButton phone={selectedLead.phone} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/50 pt-4">
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
              onClick={() => archive.mutate(selectedLead?._id || selectedLead?.id)}
              disabled={archive.isPending}
            >
              {archive.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Archive
            </Button>
            <Button
              onClick={() => confirm.mutate(selectedLead)}
              disabled={confirm.isPending}
            >
              {confirm.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm to Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
