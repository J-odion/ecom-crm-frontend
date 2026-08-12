import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Laptop, Loader2, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/devices")({
  head: () => ({ meta: [{ title: "Device Management — Ecom CRM" }] }),
  component: DevicesPage,
});

function DevicesPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Allow admin and management to see devices
  if (user?.role !== "admin" && user?.role !== "management" && user?.role !== "dev") {
    return <UnauthorizedView />;
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await apiActions.devices.list()).data,
  });

  const handleSync = async () => {
    try {
      setSyncing(true);
      await apiActions.devices.sync();
      toast.success("Sync triggered successfully. Devices will update shortly.");
      setTimeout(() => refetch(), 3000);
    } catch (e: any) {
      toast.error(e.friendlyMessage || "Failed to sync devices");
    } finally {
      setSyncing(false);
    }
  };

  const devices: any[] = Array.isArray(data) ? data : data?.data || [];
  const filtered = devices.filter((d) =>
    JSON.stringify(d).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Device Management" description="Manage company devices and employee assignments." />
        <Button variant="outline" onClick={handleSync} disabled={syncing}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync with Fleet
        </Button>
      </div>

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search devices by name, serial, type..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading devices…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Laptop} title="No devices found" description="Click Sync with Fleet to import devices from your MDM." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type / OS</th>
                    <th className="px-4 py-3 text-left">Serial Number</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const id = d._id || d.id || i;
                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          <Link to="/devices/$id" params={{ id: String(id) }} className="text-primary hover:underline flex items-center">
                            <Laptop className="h-4 w-4 mr-2 text-muted-foreground" />
                            {d.name || "Unknown Device"}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {d.type} <span className="text-muted-foreground text-xs">({d.osVersion})</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{d.serialNumber || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "Never"}
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
    </div>
  );
}
