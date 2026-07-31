import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiActions, ROLE_LABEL, type Role } from "@/lib/api";
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
import { Loader2, UserPlus, Shield, MapPin, Trash2, Mail } from "lucide-react";
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

  if (
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
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-left">Commission Rate</th>
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
                    />
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

function UserRow({ user, locations, onUpdate }: { user: any; locations: any[]; onUpdate: () => void }) {
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
            size="sm"
            className="h-8 w-[120px] text-xs"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="e.g. Team Alpha"
          />
        ) : (
          <span className="text-xs text-muted-foreground">{user.team || "—"}</span>
        )}
      </td>
      <td className="px-4 py-4">
        {isEditing ? (
          <Input
            size="sm"
            type="number"
            className="h-8 w-[80px] text-xs"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            placeholder="0"
          />
        ) : (
          <span className="text-xs text-muted-foreground">
            {user.commissionRate !== undefined && user.commissionRate !== null
              ? `${user.commissionRate}%`
              : "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        {isEditing ? (
          <Input
            size="sm"
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
