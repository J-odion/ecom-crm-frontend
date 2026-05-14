import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { api, ROLE_LABEL, type Role } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Users — Ecom CRM" }] }),
  component: UsersPage,
});

const ROLES: Role[] = ["admin", "customer_service", "logistics", "accountant", "sales_agent", "delivery_agent"];

function UsersPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", role: "sales_agent" as Role });
  const create = useMutation({
    mutationFn: async () => (await api.post("/users", form)).data,
    onSuccess: () => {
      toast.success("User created");
      setForm({ email: "", password: "", role: "sales_agent" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed"),
  });

  if (user?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Users" />
        <Card><CardContent className="p-12 text-center text-muted-foreground">Admins only.</CardContent></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Users" description="Provision new team members and assign roles." />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Invite user</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="mb-1.5 block">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="mb-1.5 block">Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => create.mutate()} disabled={!form.email || form.password.length < 6 || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create user
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
