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

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Team Management — Ecom CRM" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await apiActions.users.list()).data,
  });

  const { data: locationData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await apiActions.locations.list()).data,
  });

  const users: any[] = Array.isArray(userData) ? userData : userData?.data || [];
  const locations: any[] = Array.isArray(locationData) ? locationData : locationData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Provision accounts, assign roles, and set office locations for your staff."
        actions={
          <CreateUserDialog
            locations={locations}
            onDone={() => qc.invalidateQueries({ queryKey: ["users"] })}
          />
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
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState<Role>(user.role);
  const [locationId, setLocationId] = useState<string>(user.locationId || "none");

  const update = useMutation({
    mutationFn: () => apiActions.users.update(user.id || user._id, { role, locationId: locationId === "none" ? null : locationId }),
    onSuccess: () => {
      toast.success("User updated");
      setIsEditing(false);
      onUpdate();
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update"),
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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
            {user.email.slice(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{user.name || "Unnamed User"}</span>
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
            {locations.find(l => (l.id || l._id) === user.locationId)?.name || "Remote / Unassigned"}
          </div>
        )}
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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales_agent" as Role, locationId: "none" });

  const create = useMutation({
    mutationFn: () => apiActions.users.update("new", { ...form, locationId: form.locationId === "none" ? null : form.locationId }),
    onSuccess: () => {
      toast.success("User created");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "sales_agent", locationId: "none" });
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
              <Input placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Work Email</Label>
              <Input type="email" placeholder="john@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Initial Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
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
              <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
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
          <Button onClick={() => create.mutate()} disabled={!form.email || !form.password || create.isPending} className="w-full">
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create User Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
