import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { BookOpen, FolderOpen, Loader2, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/accounting")({
  head: () => ({ meta: [{ title: "Accounting — Ecom CRM" }] }),
  component: AccountingPage,
});

function AccountingPage() {
  const { user } = useAuth();
  
  // Only Admin or Accountant
  if (user?.role !== "admin" && user?.role !== "accountant") {
    return <UnauthorizedView />;
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader 
        title="Accounting & General Ledger" 
        description="Double-entry ledger, chart of accounts, and financial periods." 
      />

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="periods">Accounting Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="journals">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="periods">
          <AccountingPeriodsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ----------------------------------------------------------------------
// CHART OF ACCOUNTS
// ----------------------------------------------------------------------
function ChartOfAccountsTab() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: async () => (await api.get("/accounting/accounts")).data,
  });
  const accounts: any[] = Array.isArray(data) ? data : data?.data || [];

  const seedMut = useMutation({
    mutationFn: async () => (await api.post("/accounting/accounts/seed")).data,
    onSuccess: (res: any) => {
      toast.success(res?.message || "Default accounts seeded.");
      qc.invalidateQueries({ queryKey: ["accounting-accounts"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to seed accounts")
  });

  const [form, setForm] = useState({ code: "", name: "", type: "ASSET", normalBalance: "DEBIT", isActive: true });
  const createMut = useMutation({
    mutationFn: async () => (await api.post("/accounting/accounts", form)).data,
    onSuccess: () => {
      toast.success("Account created successfully");
      setIsModalOpen(false);
      qc.invalidateQueries({ queryKey: ["accounting-accounts"] });
      setForm({ code: "", name: "", type: "ASSET", normalBalance: "DEBIT", isActive: true });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create account")
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
        <div>
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>Manage your organization's financial accounts.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
            {seedMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Seed Defaults
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : accounts.length === 0 ? (
          <EmptyState icon={BookOpen} title="No accounts yet" description="Seed default accounts or create a custom one to begin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Account Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Normal Balance</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc._id || acc.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{acc.code}</td>
                    <td className="px-4 py-3 font-medium">{acc.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={acc.type} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{acc.normalBalance}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acc.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {acc.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="1050" />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Stripe Holding" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSET">Asset</SelectItem>
                    <SelectItem value="LIABILITY">Liability</SelectItem>
                    <SelectItem value="EQUITY">Equity</SelectItem>
                    <SelectItem value="REVENUE">Revenue</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Normal Balance</Label>
                <Select value={form.normalBalance} onValueChange={v => setForm({ ...form, normalBalance: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT">Debit</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={form.isActive} onCheckedChange={c => setForm({ ...form, isActive: c })} />
              <Label>Active Account</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.code || !form.name || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ----------------------------------------------------------------------
// JOURNAL ENTRIES
// ----------------------------------------------------------------------
function JournalEntriesTab() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: accountsData } = useQuery({
    queryKey: ["accounting-accounts"],
    queryFn: async () => (await api.get("/accounting/accounts")).data,
  });
  const accounts: any[] = Array.isArray(accountsData) ? accountsData : accountsData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ["accounting-journals"],
    queryFn: async () => (await api.get("/accounting/journals")).data,
  });
  const journals: any[] = Array.isArray(data) ? data : data?.data || [];

  const postMut = useMutation({
    mutationFn: async (id: string) => (await api.post(`/accounting/journals/${id}/post`)).data,
    onSuccess: () => {
      toast.success("Journal entry posted successfully");
      qc.invalidateQueries({ queryKey: ["accounting-journals"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to post entry")
  });

  const [form, setForm] = useState({
    journalNumber: `JRN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString().slice(0, 10),
    description: "",
    lines: [
      { accountId: "", debit: 0, credit: 0 },
      { accountId: "", debit: 0, credit: 0 }
    ]
  });

  const totalDebit = form.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const createMut = useMutation({
    mutationFn: async () => (await api.post("/accounting/journals", form)).data,
    onSuccess: () => {
      toast.success("Journal entry drafted successfully");
      setIsModalOpen(false);
      qc.invalidateQueries({ queryKey: ["accounting-journals"] });
      setForm({
        journalNumber: `JRN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString().slice(0, 10),
        description: "",
        lines: [
          { accountId: "", debit: 0, credit: 0 },
          { accountId: "", debit: 0, credit: 0 }
        ]
      });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create journal entry")
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
        <div>
          <CardTitle>Journal Entries</CardTitle>
          <CardDescription>Record manual adjustments and transfers.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : journals.length === 0 ? (
          <EmptyState icon={BookOpen} title="No journal entries" description="Create a manual entry to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Journal #</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {journals.map(jrn => {
                  const id = jrn._id || jrn.id;
                  const isPosted = /post/i.test(jrn.status || "");
                  return (
                    <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">{jrn.journalNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(jrn.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{jrn.description}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={jrn.status || "DRAFT"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isPosted && (
                          <Button size="sm" variant="outline" onClick={() => postMut.mutate(String(id))} disabled={postMut.isPending}>
                            Post
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Journal Number</Label>
                <Input value={form.journalNumber} onChange={e => setForm({ ...form, journalNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Owner Injection..." />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Lines</h4>
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, lines: [...form.lines, { accountId: "", debit: 0, credit: 0 }] })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Line
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase px-2">
                  <div className="col-span-6">Account</div>
                  <div className="col-span-3">Debit (₦)</div>
                  <div className="col-span-3">Credit (₦)</div>
                </div>
                {form.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-6">
                      <Select value={line.accountId} onValueChange={v => {
                        const newLines = [...form.lines];
                        newLines[idx].accountId = v;
                        setForm({ ...form, lines: newLines });
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => (
                            <SelectItem key={a._id || a.id} value={a._id || a.id}>{a.code} - {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input 
                        type="number" 
                        value={line.debit || ""} 
                        onChange={e => {
                          const newLines = [...form.lines];
                          newLines[idx].debit = Number(e.target.value);
                          newLines[idx].credit = 0; // mutually exclusive usually, but let user fix it
                          setForm({ ...form, lines: newLines });
                        }} 
                      />
                    </div>
                    <div className="col-span-3">
                      <Input 
                        type="number" 
                        value={line.credit || ""} 
                        onChange={e => {
                          const newLines = [...form.lines];
                          newLines[idx].credit = Number(e.target.value);
                          newLines[idx].debit = 0;
                          setForm({ ...form, lines: newLines });
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border border-border">
                <span className="font-semibold text-sm">Totals</span>
                <div className="flex gap-16 text-sm font-mono mr-[15%]">
                  <span className={totalDebit !== totalCredit ? "text-destructive" : "text-success"}>₦{totalDebit.toLocaleString()}</span>
                  <span className={totalDebit !== totalCredit ? "text-destructive" : "text-success"}>₦{totalCredit.toLocaleString()}</span>
                </div>
              </div>
              {!isBalanced && (
                <p className="text-xs text-destructive text-right">Debits must equal Credits.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!isBalanced || !form.description || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Draft Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ----------------------------------------------------------------------
// PERIODS
// ----------------------------------------------------------------------
function AccountingPeriodsTab() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ["accounting-periods"],
    queryFn: async () => (await api.get("/accounting/periods")).data,
  });
  const periods: any[] = Array.isArray(data) ? data : data?.data || [];

  const closeMut = useMutation({
    mutationFn: async (id: string) => (await api.post(`/accounting/periods/${id}/close`)).data,
    onSuccess: () => {
      toast.success("Period closed successfully");
      qc.invalidateQueries({ queryKey: ["accounting-periods"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to close period")
  });

  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const createMut = useMutation({
    mutationFn: async () => (await api.post("/accounting/periods", form)).data,
    onSuccess: () => {
      toast.success("Period opened successfully");
      setIsModalOpen(false);
      qc.invalidateQueries({ queryKey: ["accounting-periods"] });
      setForm({ name: "", startDate: "", endDate: "" });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to open period")
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
        <div>
          <CardTitle>Accounting Periods</CardTitle>
          <CardDescription>Open and close financial periods.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Open Period
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : periods.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No periods" description="Open a new accounting period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Period Name</th>
                  <th className="px-4 py-3 text-left">Start Date</th>
                  <th className="px-4 py-3 text-left">End Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {periods.map(p => {
                  const id = p._id || p.id;
                  const isClosed = /closed/i.test(p.status || "");
                  return (
                    <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{new Date(p.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{new Date(p.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status || "OPEN"} /></td>
                      <td className="px-4 py-3 text-right">
                        {!isClosed && (
                          <Button size="sm" variant="outline" onClick={() => closeMut.mutate(String(id))} disabled={closeMut.isPending}>
                            Close Period
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open New Period</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Period Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="August 2026" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!form.name || !form.startDate || !form.endDate || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
