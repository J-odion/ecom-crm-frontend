import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ClipboardList, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — Ecom CRM" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/leads")).data,
  });
  const leads: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div>
      <PageHeader title="Leads" description="Inbound leads ready for contact and scheduling." />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : leads.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No leads yet" description="Leads collected from your funnels will land here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Lead</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => {
                    const id = l._id || l.id || i;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link to="/leads/$id" params={{ id: String(id) }} className="text-primary hover:underline">
                            #{String(id).slice(-6)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{l.customerName || l.name || "—"}</td>
                        <td className="px-4 py-3">{l.product || "—"}</td>
                        <td className="px-4 py-3">{l.phone || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
