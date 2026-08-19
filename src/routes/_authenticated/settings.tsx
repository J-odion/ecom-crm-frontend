import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiActions } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Laptop } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Ecom CRM" }] }),
  component: SettingsPage,
});

const ROLES: Role[] = ["admin", "customer_service", "logistics", "accountant", "sales_agent", "delivery_agent"];

function SettingsPage() {
  const { user, logout, setRoleOverride } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin" || user?.role === "dev";

  const { data: meData, isLoading: meLoading } = useQuery({
    queryKey: ["analytics-me"],
    queryFn: async () => (await apiActions.analytics.me()).data,
  });
  const me = meData?.data || meData || user;

  const { data: devicesData } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await apiActions.devices.list()).data,
  });
  const devices = Array.isArray(devicesData) ? devicesData : devicesData?.data || [];
  const myDevice = devices.find((d: any) => 
    (d.assignedTo?._id === user?.id || d.assignedTo === user?.id || d.assignedTo?._id === user?._id || d.assignedTo === user?._id)
  );

  const returnDevice = useMutation({
    mutationFn: async (deviceId: string) => (await apiActions.devices.unassign(deviceId)).data,
    onSuccess: () => {
      toast.success("Device returned successfully");
      qc.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to return device"),
  });

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div>
      <PageHeader title="Settings / Profile" description="Account details & workspace preferences." />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {meLoading ? (
              <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Loading...</div>
            ) : (
              <>
                <Row k="Email" v={me?.email || user?.email} />
                <Row k="Role" v={user?.role ? ROLE_LABEL[user.role as Role] : "—"} />
                <Row k="Base Salary" v={me?.salary ? `₦${Number(me.salary).toLocaleString()}` : "—"} />
                <Row k="Total Commissions" v={(me?.allTimeCommission || me?.allTimeCommissions) ? `₦${Number(me.allTimeCommission || me.allTimeCommissions).toLocaleString()}` : "₦0"} />
                
                <div className="pt-4 border-t border-border mt-4">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Assigned Device</h4>
                  {myDevice ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <Laptop className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{myDevice.name}</p>
                          <p className="text-[10px] text-muted-foreground">Serial: {myDevice.serialNumber || "—"}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 mt-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { if(confirm("Return this device?")) returnDevice.mutate(myDevice._id || myDevice.id) }}
                            disabled={returnDevice.isPending}
                          >
                            {returnDevice.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                            Return Device
                          </Button>
                          <Button size="sm" variant="secondary" asChild>
                            <Link to="/devices/$id" params={{ id: String(myDevice._id || myDevice.id) }}>
                              Manage Device
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No device assigned to your custody.</p>
                  )}
                </div>
              </>
            )}
            <div className="pt-4 border-t border-border mt-4">
              <Button variant="destructive" onClick={handleLogout}>Sign out</Button>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader><CardTitle>Preview as role</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Switch the UI to preview a different role's view (does not change server permissions).</p>
              <Label className="mb-1.5 block">Role</Label>
              <Select value={user?.role} onValueChange={(v) => setRoleOverride(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="col-span-2">{v ?? "—"}</span>
    </div>
  );
}
