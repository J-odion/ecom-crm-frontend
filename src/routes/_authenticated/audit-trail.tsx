import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiActions, ROLE_LABEL, type Role } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Terminal, User, Calendar, Activity, Info } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/audit-trail")({
  head: () => ({ meta: [{ title: "Audit Trail — Ecom CRM" }] }),
  component: AuditTrailPage,
});

function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["audit-trail"],
    queryFn: async () => (await apiActions.auditTrail.list()).data,
  });

  const logs: any[] = Array.isArray(logsData) ? logsData : logsData?.data || [];

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.userEmail?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.userId?.fullName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail Logs"
        description="Monitor system-wide mutations and API actions taken by CRM staff accounts."
      />

      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by email, action description, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading audit trail...
            </div>
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No logs recorded"
              description="Try adjusting your filter keyword or perform operations to generate logs."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">User Account</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">IP Address</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <AuditRow key={log._id || log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditRow({ log }: { log: any }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <tr className="border-b border-border/60 hover:bg-muted/30">
      <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {new Date(log.createdAt).toLocaleString()}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs uppercase font-bold">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-foreground">{log.userId?.fullName || "System/Unknown"}</span>
            <span className="text-[10px] text-muted-foreground">{log.userEmail}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <code className="text-xs font-semibold bg-muted/80 px-2 py-0.5 rounded text-indigo-600 font-mono">
            {log.action}
          </code>
        </div>
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
            log.details?.status === "SUCCESS"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {log.details?.status || "SUCCESS"}
        </span>
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground">
        {log.ip || "—"}
      </td>
      <td className="px-4 py-4 text-right">
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 px-2">
              <Info className="h-3.5 w-3.5 mr-1" /> Details
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Audit Action Log Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-xs mt-2">
              <div className="grid grid-cols-3 py-1.5 border-b">
                <span className="font-semibold text-muted-foreground">Log ID:</span>
                <span className="col-span-2 font-mono">{log._id}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b">
                <span className="font-semibold text-muted-foreground">Action String:</span>
                <span className="col-span-2 font-mono bg-muted px-1.5 py-0.5 rounded text-indigo-600">{log.action}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b">
                <span className="font-semibold text-muted-foreground">User Name / Email:</span>
                <span className="col-span-2">{log.userId?.fullName || "—"} ({log.userEmail})</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b">
                <span className="font-semibold text-muted-foreground">Created At:</span>
                <span className="col-span-2">{new Date(log.createdAt).toString()}</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 border-b">
                <span className="font-semibold text-muted-foreground">Client Address IP:</span>
                <span className="col-span-2">{log.ip}</span>
              </div>

              {log.details?.body && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-semibold text-muted-foreground block">Payload Details:</span>
                  <pre className="p-3 bg-muted rounded-md overflow-x-auto font-mono text-[10px] leading-relaxed max-h-48">
                    {JSON.stringify(log.details.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  );
}
