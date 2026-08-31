import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Shield, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/permissions")({
  head: () => ({ meta: [{ title: "Access & Permissions — Ecom CRM" }] }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await apiActions.users.list()).data,
  });
  const users: any[] = Array.isArray(usersData) ? usersData : usersData?.data || [];

  return (
    <RoleGate allowedRoles={["admin", "dev"]}>
      <div className="space-y-6">
        <PageHeader
          title="Access & Permissions"
          description="Manage roles, departments, and granular permissions for all users."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List Pane */}
          <Card className="lg:col-span-1 border-r-0 lg:border-r">
            <CardHeader className="px-4 py-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center">
                <Users className="w-4 h-4 mr-2" /> Select User
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
              {loadingUsers ? (
                <div className="p-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
              ) : (
                <div className="divide-y">
                  {users.map(u => (
                    <button
                      key={u._id || u.id}
                      onClick={() => setSelectedUserId(u._id || u.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between ${selectedUserId === (u._id || u.id) ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                    >
                      <div>
                        <div className="font-medium text-sm text-foreground">{u.fullName || u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Pane */}
          <div className="lg:col-span-2">
            {selectedUserId ? (
              <UserAccessManager userId={selectedUserId} user={users.find(u => (u._id || u.id) === selectedUserId)} />
            ) : (
              <Card className="h-full min-h-[400px] flex items-center justify-center text-muted-foreground border-dashed">
                <div className="text-center">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Select a user from the left pane to manage their access.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

function UserAccessManager({ userId, user }: { userId: string, user: any }) {
  const qc = useQueryClient();

  const { data: accessData, isLoading: loadingAccess } = useQuery({
    queryKey: ["userAccess", userId],
    queryFn: async () => (await apiActions.accessControl.getUserAccess(userId)).data,
  });

  const { data: groupedData } = useQuery({
    queryKey: ["permissionsGrouped"],
    queryFn: async () => (await apiActions.permissions.getGrouped()).data,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await apiActions.accessControl.getDepartments()).data,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await apiActions.accessControl.getRoles()).data,
  });

  const access = accessData;
  const groupedPerms = groupedData || {};
  const departments = departmentsData || [];
  const roles = rolesData || [];

  const updateRole = useMutation({
    mutationFn: (roleId: string | null) => apiActions.accessControl.assignRole(userId, roleId),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["userAccess", userId] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update role"),
  });

  const toggleOverride = useMutation({
    mutationFn: ({ key, granted }: { key: string; granted: boolean }) => 
      apiActions.accessControl.toggleOverride(userId, key, granted, "Manual toggle from permissions page"),
    onSuccess: () => {
      toast.success("Permission updated");
      qc.invalidateQueries({ queryKey: ["userAccess", userId] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update permission"),
  });

  if (loadingAccess) {
    return <Card className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>{user?.fullName || user?.email}</span>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground uppercase font-mono">{user?.role}</span>
          </CardTitle>
          <CardDescription>Manage roles and direct permission overrides</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <Label>Assigned Group Role</Label>
            <Select 
              value={access?.role?._id || access?.role?.id || "none"} 
              onValueChange={(val) => updateRole.mutate(val === "none" ? null : val)}
            >
              <SelectTrigger className="w-full sm:w-[300px]"><SelectValue placeholder="Select a Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Role Assigned</SelectItem>
                {roles.map((r: any) => (
                  <SelectItem key={r._id || r.id} value={r._id || r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The base role provides a default set of permissions.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-md flex items-center">
            <Key className="w-4 h-4 mr-2" /> Granular Permissions
          </CardTitle>
          <CardDescription>Explicitly grant or revoke permissions for this user.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 p-0">
          {Object.entries(groupedPerms).map(([groupName, perms]: [string, any]) => (
            <div key={groupName} className="border-b last:border-b-0">
              <div className="px-6 py-2 bg-muted/30 font-semibold text-sm text-foreground/80 uppercase tracking-wide">
                {groupName}
              </div>
              <div className="divide-y divide-border/50">
                {perms.map((p: any) => {
                  const isGranted = access?.resolvedPermissions?.includes(p.key) || false;
                  // Look for explicit override
                  const override = access?.overrides?.find((o: any) => o.permissionKey === p.key);
                  const isExplicit = !!override;
                  
                  return (
                    <div key={p.key} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {p.name}
                          {isExplicit && (
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${override.granted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                              {override.granted ? 'Explicit Grant' : 'Explicit Revoke'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">{p.key}</div>
                      </div>
                      <div className="flex items-center">
                        <Switch
                          checked={isGranted}
                          disabled={toggleOverride.isPending}
                          onCheckedChange={(checked) => {
                            toggleOverride.mutate({ key: p.key, granted: checked });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(groupedPerms).length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No permissions schema found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
