import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Users, Shield, Key, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/permission-gate";

export const Route = createFileRoute("/_authenticated/permissions")({
  head: () => ({ meta: [{ title: "Access & Permissions — Ecom CRM" }] }),
  component: PermissionsPage,
});

const FALLBACK_PERMS = {
  "Orders & Leads": [
    { key: "orders:view", name: "View Orders", description: "Can view the orders list" },
    { key: "orders:manage", name: "Manage Orders", description: "Can update status, add comments, mark delivered" }
  ],
  "Logistics & Deliveries": [
    { key: "deliveries:view", name: "View Deliveries", description: "Can view the deliveries list" },
    { key: "deliveries:manage", name: "Manage Deliveries", description: "Can assign deliveries and update delivery status" }
  ],
  "Inventory": [
    { key: "inventory:view", name: "View Inventory", description: "Can view the inventory products and stock levels" },
    { key: "inventory:manage", name: "Manage Inventory", description: "Can add products, stock in, and transfer stock" }
  ],
  "Finance": [
    { key: "finance:view", name: "View Finance", description: "Can view financial dashboards and reports" },
    { key: "finance:manage", name: "Manage Finance", description: "Can update financial records" }
  ],
  "Devices": [
    { key: "devices:view", name: "View Devices", description: "Can view fleet devices" },
    { key: "devices:manage", name: "Manage Devices", description: "Can add and sync devices" }
  ],
  "Users & Locations": [
    { key: "users:view", name: "View Users", description: "Can view users list" },
    { key: "users:manage", name: "Manage Users", description: "Can create and edit users" },
    { key: "locations:manage", name: "Manage Locations", description: "Can add and manage locations" }
  ],
  "System": [
    { key: "permissions:manage", name: "Manage Permissions", description: "Can manage user roles and granular access overrides" },
    { key: "commissions:manage", name: "Manage Commissions", description: "Can configure commission rules" }
  ]
};

function PermissionsPage() {
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await apiActions.users.list()).data,
  });
  const users: any[] = Array.isArray(usersData) ? usersData : usersData?.data || [];

  return (
    <PermissionGate allowedPermissions={["permissions:manage"]}>
      <div className="space-y-6">
        <PageHeader
          title="Access & Permissions"
          description="Manage roles, departments, and granular permissions for all users."
          actions={<CreateRoleDialog onDone={() => qc.invalidateQueries({ queryKey: ["roles"] })} />}
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
    </PermissionGate>
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

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await apiActions.accessControl.getRoles()).data,
  });

  const access = accessData || { roleId: null, roleName: "", permissions: {}, overrides: {} };
  let groupedPerms = groupedData || {};
  if (Object.keys(groupedPerms).length === 0) {
    groupedPerms = FALLBACK_PERMS;
  }
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
    mutationFn: ({ key, value }: { key: string; value: boolean }) => 
      apiActions.accessControl.toggleOverride(userId, key, value),
    onSuccess: () => {
      toast.success("Permission updated");
      qc.invalidateQueries({ queryKey: ["userAccess", userId] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update permission"),
  });

  const removeOverride = useMutation({
    mutationFn: (key: string) => apiActions.accessControl.removeOverride(userId, key),
    onSuccess: () => {
      toast.success("Override removed, reverted to default");
      qc.invalidateQueries({ queryKey: ["userAccess", userId] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to remove override"),
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
              value={access.roleId || "none"} 
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
                  const hasOverride = access.overrides && p.key in access.overrides;
                  const isGranted = hasOverride ? access.overrides[p.key] : access.permissions?.[p.key] || false;
                  const overrideVal = hasOverride ? access.overrides[p.key] : null;
                  
                  return (
                    <div key={p.key} className="flex items-center justify-between px-6 py-4 hover:bg-muted/10">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {p.name}
                          {hasOverride && (
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${overrideVal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                              {overrideVal ? 'Explicit Grant' : 'Explicit Revoke'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60">{p.key}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasOverride && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeOverride.mutate(p.key)}
                            disabled={removeOverride.isPending}
                            title="Reset to default"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Switch
                          checked={isGranted}
                          disabled={toggleOverride.isPending}
                          onCheckedChange={(checked) => {
                            toggleOverride.mutate({ key: p.key, value: checked });
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

function CreateRoleDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => (await apiActions.accessControl.createRole(form)).data,
    onSuccess: () => {
      toast.success("Role created successfully");
      setOpen(false);
      setForm({ name: "", description: "" });
      onDone();
      // Refetch roles explicitly just in case
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to create role"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Role</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Role Name</Label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="e.g. Regional Manager" 
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              placeholder="What does this role do?" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
