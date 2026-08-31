import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiActions, ROLE_LABEL, type Role } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Shield, MapPin, Trash2, Laptop, BarChart2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";

import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Team Management — Ecom CRM" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await apiActions.users.list()).data,
  });

  const { data: locationData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await apiActions.locations.list()).data,
  });

  if(
    user?.role !== "admin" &&
    user?.role !== "dev" &&
    user?.role !== "manager" &&
    user?.role !== "accountant"
  ) {
    return <UnauthorizedView />;
  }

  const users: any[] = Array.isArray(userData) ? userData : userData?.data || [];
  const locations: any[] = Array.isArray(locationData) ? locationData : locationData?.data || [];

  const canCreate = user?.role === "admin" || user?.role === "dev";

  const [dashboardUser, setDashboardUser] = useState<any | null>(null);
  const [deviceUser, setDeviceUser] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Provision accounts, assign roles, and set office locations for your staff."
        actions={
          canCreate ? (
            <CreateUserDialog
              locations={locations}
              onDone={() => qc.invalidateQueries({ queryKey: ["users"] })}
            />
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading team...
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Your team is empty"
              description="Start by inviting your first team member."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Staff Member</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Base Salary</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow
                      key={u.id || u._id}
                      user={u}
                      locations={locations}
                      onUpdate={() => qc.invalidateQueries({ queryKey: ["users"] })}
                      onOpenDashboard={() => setDashboardUser(u)}
                      onOpenDevice={() => setDeviceUser(u)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDashboardDialog user={dashboardUser} onClose={() => setDashboardUser(null)} />
      <AssignDeviceToUserDialog 
        user={deviceUser} 
        onClose={() => setDeviceUser(null)} 
        onDone={() => qc.invalidateQueries({ queryKey: ["users"] })} 
      />
    </div>
  );
}

function UserRow({ user, locations, onUpdate, onOpenDashboard, onOpenDevice }: { user: any; locations: any[]; onUpdate: () => void; onOpenDashboard: () => void; onOpenDevice: () => void; }) {
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState<Role>(user.role);
  const [locationId, setLocationId] = useState<string>(user.locationId || "none");
  const [team, setTeam] = useState<string>(user.team || "");
  const [commissionRate, setCommissionRate] = useState<string>(user.commissionRate?.toString() || "");
  const [salary, setSalary] = useState<string>(user.salary?.toString() || "");

  const update = useMutation({
    mutationFn: () =>
      apiActions.users.update(user.id || user._id, {
        role,
        locationId: locationId === "none" ? null : locationId,
        team: team || null,
        commissionRate: commissionRate ? Number(commissionRate) : null,
        salary: salary ? Number(salary) : null,
      }),
    onSuccess: () => {
      toast.success("User updated");
      setIsEditing(false);
      onUpdate();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update"),
  });

  const toggleActive = useMutation({
    mutationFn: () => apiActions.users.toggleStatus(user.id || user._id),
    onSuccess: () => {
      toast.success("User status toggled");
      onUpdate();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to toggle status"),
  });

  const remove = useMutation({
    mutationFn: () => apiActions.users.delete(user.id || user._id),
    onSuccess: () => {
      toast.success("User removed");
      onUpdate();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to remove"),
  });

  return (
    <tr className="border-b border-border/60 hover:bg-muted/30">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
              {user.email.slice(0, 2)}
            </div>
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                user.isOnline ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{user.fullName || user.name || "Unnamed User"}</span>
            <span className="text-[11px] text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        {isEditing ? (
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            {ROLE_LABEL[user.role as Role] || user.role}
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        {isEditing ? (
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Location</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id || l._id} value={l.id || l._id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {locations.find((l) => (l.id || l._id) === user.locationId)?.name || "Remote / Unassigned"}
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        {isEditing ? (
          <Input
            type="number"
            className="h-8 w-[100px] text-xs"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="150000"
          />
        ) : (
          <span className="text-xs text-muted-foreground">
            {user.salary !== undefined && user.salary !== null
              ? `₦${Number(user.salary).toLocaleString()}`
              : "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
          className={`h-7 px-2.5 text-[11px] font-semibold rounded-full ${
            user.isActive
              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20"
          }`}
        >
          {toggleActive.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : user.isActive ? (
            "Active"
          ) : (
            "Inactive"
          )}
        </Button>
      </td>
      <td className="px-4 py-4 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={() => update.mutate()} disabled={update.isPending}>
              {update.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" className="text-xs px-2" title="Performance Dashboard" onClick={onOpenDashboard}>
              <BarChart2 className="h-4 w-4 text-primary" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs px-2" title="Assign Device" onClick={onOpenDevice}>
              <Laptop className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => { if(confirm("Remove this user?")) remove.mutate(); }}
              disabled={remove.isPending}
            >
              {remove.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

function CreateUserDialog({ locations, onDone }: { locations: any[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "sales_agent" as Role,
    locationId: "none",
    team: "",
    commissionRate: "",
    salary: "",
  });

  const create = useMutation({
    mutationFn: () =>
      apiActions.users.create({
        fullName: form.fullName,
        email: form.email,
        password: form.password || undefined,
        role: form.role,
        team: form.team || null,
        locationId: form.locationId === "none" ? null : form.locationId,
        commissionRate: form.commissionRate ? Number(form.commissionRate) : null,
        salary: form.salary ? Number(form.salary) : null,
      }),
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "sales_agent",
        locationId: "none",
        team: "",
        commissionRate: "",
        salary: "",
      });
      onDone();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to create"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provision new staff account</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Work Email</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Initial Password (Optional)</Label>
              <Input
                type="password"
                placeholder="Auto-generated if empty"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assign Team</Label>
              <Input
                placeholder="e.g. Team Alpha"
                value={form.team}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                placeholder="10"
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Base Salary (₦)</Label>
              <Input
                type="number"
                placeholder="150000"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as Role })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select
                value={form.locationId}
                onValueChange={(v) => setForm({ ...form, locationId: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Remote / Unassigned</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id || l._id} value={l.id || l._id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.email || !form.fullName || create.isPending}
            className="w-full"
          >
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create User Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDeviceToUserDialog({ user, onClose, onDone }: { user: any; onClose: () => void; onDone: () => void }) {
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [reason, setReason] = useState("");

  const isOpen = !!user;

  const { data: devicesData, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await apiActions.devices.list()).data,
    enabled: isOpen,
  });
  const devices = Array.isArray(devicesData) ? devicesData : devicesData?.data || [];

  const assign = useMutation({
    mutationFn: async () => apiActions.devices.assign(selectedDevice, { userId: user.id || user._id, reason }),
    onSuccess: () => {
      toast.success("Device assigned to user");
      onClose();
      onDone();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to assign device"),
  });

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Device to {user?.fullName || user?.name || user?.email}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>Select Device</Label>
            {isLoading ? <div className="text-xs flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading devices...</div> : (
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger><SelectValue placeholder="Select a device" /></SelectTrigger>
                <SelectContent>
                  {devices.map((d: any) => (
                    <SelectItem key={d.id || d._id} value={d.id || d._id}>
                      {d.name} {d.serialNumber ? `(${d.serialNumber})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Notes / Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Work laptop" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => assign.mutate()} disabled={!selectedDevice || assign.isPending}>
            {assign.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserDashboardDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const isOpen = !!user;

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["userAnalytics", user?.id || user?._id],
    queryFn: async () => (await api.get(`/analytics/users/${user?.id || user?._id}`)).data,
    enabled: isOpen,
  });

  const analytics = analyticsData?.data || analyticsData;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Performance Dashboard - {user?.fullName || user?.name || user?.email}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading metrics...
            </div>
          ) : !analytics ? (
             <div className="text-center text-sm text-muted-foreground p-4">No performance data available for this user.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <h3 className="text-lg font-semibold">Overall Rating</h3>
                  <p className="text-sm text-muted-foreground">Performance score based on recent activity</p>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {analytics.rating}%
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-muted/10 border-border/40 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Leads Gen / Processed</p>
                    <p className="text-2xl font-bold mt-1">{analytics.metrics?.leadsGenerated || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/10 border-border/40 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Orders Scheduled</p>
                    <p className="text-2xl font-bold mt-1">{analytics.metrics?.ordersScheduled || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Orders Delivered</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-700">{analytics.metrics?.deliveredOrders || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/10 border-border/40 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Conversion Rate</p>
                    <p className="text-2xl font-bold mt-1">{analytics.metrics?.conversionRate || 0}%</p>
                  </CardContent>
                </Card>
                {(user?.role === 'media_buyer' || user?.role === 'admin') && (
                  <>
                    <Card className="bg-muted/10 border-border/40 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Ad Spend</p>
                        <p className="text-2xl font-bold mt-1">₦{(analytics.metrics?.adSpend || 0).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/10 border-border/40 shadow-none">
                      <CardContent className="p-4">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Avg CPA</p>
                        <p className="text-2xl font-bold mt-1">₦{(analytics.metrics?.cpa || 0).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-[11px] font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Financial Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-md bg-muted/20 border border-border/40">
                    <p className="text-xs text-muted-foreground">Base Salary</p>
                    <p className="text-lg font-semibold">₦{(analytics.financials?.salary || user?.salary || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-600 font-medium">Pending Commission</p>
                    <p className="text-lg font-bold text-emerald-700">₦{(analytics.financials?.commission || user?.currentCommission || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
