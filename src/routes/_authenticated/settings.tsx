import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/role-gate";
import { EmptyState } from "@/components/empty-state";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Ecom CRM" }] }),
  component: SettingsPage,
});

const ROLES: Role[] = ["admin", "customer_service", "logistics", "accountant", "sales_agent", "delivery_agent"];

function SettingsPage() {
  const { user, logout, setRoleOverride } = useAuth();
  return (
    <div>
      <PageHeader title="Settings" description="Account & workspace preferences." />
      
      <RoleGate 
        allowedRoles="admin" 
        fallback={
          <Card>
            <CardContent className="py-12">
              <EmptyState 
                icon={ShieldAlert} 
                title="Admin access required" 
                description="The settings workspace is restricted to administrators. Please contact your manager for role changes." 
              />
            </CardContent>
          </Card>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row k="Email" v={user?.email} />
              <Row k="Role" v={user?.role ? ROLE_LABEL[user.role] : "—"} />
              <Button variant="destructive" onClick={logout}>Sign out</Button>
            </CardContent>
          </Card>
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
        </div>
      </RoleGate>
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
