import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ShoppingCart, Loader2, MoreHorizontal, Copy, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { UnauthorizedView } from "@/components/unauthorized-view";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { isToday, isFuture, isPast, parseISO, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders Management — Ecom CRM" }] }),
  component: OrdersPage,
});

const STATUS_TABS = [
  "pending",
  "abandoned",
  "scheduled",
  "delivered",
  "cancelled",
  "deleted",
  "failed",
  "banned"
];

const MEDIA_BUYER_TABS = [
  "pending",
  "abandoned",
  "scheduled",
  "delivered"
];

function OrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [scheduleSubTab, setScheduleSubTab] = useState("today");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");

  // View Modal State
  const [viewItem, setViewItem] = useState<any | null>(null);

  // Comment Modal State
  const [commentItem, setCommentItem] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");

  // Schedule Modal State
  const [scheduleItem, setScheduleItem] = useState<any | null>(null);
  const [scheduleData, setScheduleData] = useState({
    address: "",
    quantity: 1,
    notes: "",
    scheduleDate: new Date().toISOString().split("T")[0]
  });

  // Delivered Modal State
  const [deliveredItem, setDeliveredItem] = useState<any | null>(null);
  const [deliveredData, setDeliveredData] = useState({
    agent: "",
    quantity: 1,
    amountPaid: "",
    deliveryFee: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    soldBy: "",
    expenseName: "",
    expenseAmount: ""
  });

  // Status Reason Modal State
  const [statusReasonItem, setStatusReasonItem] = useState<{ item: any, status: string } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  // Activity Timeline State
  const [activityItem, setActivityItem] = useState<any | null>(null);

  const isLeadTab = activeTab === "pending" || activeTab === "abandoned";

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await apiActions.orders.list()).data,
  });

  const rawData = Array.isArray(ordersData) ? ordersData : ordersData?.data || [];

  let currentData = rawData.filter((o: any) => (o.status || "pending").toLowerCase() === activeTab);

  if (activeTab === "scheduled") {
    currentData = currentData.filter((o: any) => {
      if (!o.scheduleDate) return false;
      const d = startOfDay(parseISO(o.scheduleDate));
      const today = startOfDay(new Date());
      if (scheduleSubTab === "today") return d.getTime() === today.getTime();
      if (scheduleSubTab === "future") return d.getTime() > today.getTime();
      if (scheduleSubTab === "past") return d.getTime() < today.getTime();
      return true;
    });
  }

  if (dateFilter !== "all") {
    currentData = currentData.filter((o: any) => {
      const dateStr = o.createdAt || o.date || o.scheduleDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const now = new Date();
      
      if (dateFilter === "this week") {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        return d >= weekStart;
      }
      if (dateFilter === "this month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= monthStart;
      }
      if (dateFilter === "last week") {
        const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return d >= lastWeekStart && d <= lastWeekEnd;
      }
      if (dateFilter === "last month") {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return d >= lastMonthStart && d <= lastMonthEnd;
      }
      if (dateFilter === "custom" && customDate) {
        return d.toISOString().startsWith(customDate);
      }
      return true;
    });
  }

  const filtered = currentData.filter((o: any) =>
    JSON.stringify(o).toLowerCase().includes(q.toLowerCase())
  );

  // --- Mutations ---
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, payload }: { id: string; status: string; payload?: any }) => {
      if (status === "cash_remitted") {
        return (await apiActions.orders.updatePayment(id, { status })).data;
      }
      return (await apiActions.orders.updateDelivery(id, { status, ...payload })).data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Marked as ${variables.status}`);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update status"),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const id = commentItem._id || commentItem.id;
      return (await apiActions.orders.followUp(id, { notes: commentText })).data;
    },
    onSuccess: () => {
      toast.success("Comment added");
      setCommentItem(null);
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to add comment"),
  });

  const scheduleOrder = useMutation({
    mutationFn: async () => {
      const id = scheduleItem._id || scheduleItem.id;
      return (await apiActions.orders.updateDelivery(id, {
        status: "scheduled",
        address: scheduleData.address,
        quantity: scheduleData.quantity,
        notes: scheduleData.notes,
        scheduleDate: new Date(scheduleData.scheduleDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      toast.success("Order scheduled successfully");
      setScheduleItem(null);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to schedule order"),
  });


  if (user?.role === "sales_agent" || user?.role === "media_buyer") {
    return <UnauthorizedView />;
  }

  const isMediaBuyer = user?.role === "marketing_manager";
  const tabsToRender = isMediaBuyer ? MEDIA_BUYER_TABS : STATUS_TABS;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`, { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />});
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Orders & Leads" description="Unified view for managing leads and orders." />
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-auto">
          <TabsList className="w-max inline-flex">
            {tabsToRender.map(tab => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex w-full sm:max-w-xl shrink-0 gap-2">
          <Input placeholder="Search name, phone, product..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this week">This Week</SelectItem>
              <SelectItem value="this month">This Month</SelectItem>
              <SelectItem value="last week">Last Week</SelectItem>
              <SelectItem value="last month">Last Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {dateFilter === "custom" && (
            <Input type="date" className="w-[140px]" value={customDate} onChange={e => setCustomDate(e.target.value)} />
          )}
        </div>
      </div>

      {activeTab === "scheduled" && (
        <Tabs value={scheduleSubTab} onValueChange={setScheduleSubTab} className="w-full">
          <TabsList className="w-max inline-flex">
            <TabsTrigger value="today">Today's Delivery</TabsTrigger>
            <TabsTrigger value="future">Future Schedules</TabsTrigger>
            <TabsTrigger value="past">Past Schedules</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading data…
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShoppingCart} title={`No ${activeTab} items`} description="Nothing to display here based on your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Qty</th>
                    {!isLeadTab && <th className="px-4 py-3 text-left">Amount</th>}
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    {!isMediaBuyer && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o: any, i: number) => {
                    const id = o._id || o.id || i;
                    const custName = o.customerName || o.name || "—";
                    const isLead = isLeadTab;
                    const dateVal = o.createdAt || o.date || o.scheduleDate;

                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {custName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate" title={o.address}>
                          {o.address || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{o.product || o.productName || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.quantity || 1}</td>
                        {!isLeadTab && (
                          <td className="px-4 py-3 font-medium">{o.amount ? `₦${Number(o.amount).toLocaleString()}` : "—"}</td>
                        )}
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {dateVal ? new Date(dateVal).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status || o.deliveryStatus || (isLead ? "pending" : "")} />
                        </td>
                        {!isMediaBuyer && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(o.callNumber || o.phone) && (
                                <a href={`tel:${o.callNumber || o.phone}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </a>
                              )}
                              {(o.whatsappNumber || o.phone) && (
                                <a href={`https://wa.me/${(o.whatsappNumber || o.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                </a>
                              )}
                              <Button size="sm" variant="outline" onClick={() => setViewItem(o)} className="ml-1">
                                View
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setActivityItem(o)} title="View Activity Log">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => setCommentItem(o)}>
                                    Add Comment
                                  </DropdownMenuItem>
                                  {isLead && (
                                    <DropdownMenuItem onClick={() => {
                                      setScheduleData({ address: o.address || "", quantity: 1, notes: "", scheduleDate: new Date().toISOString().split("T")[0] });
                                      setScheduleItem(o);
                                    }}>
                                      Schedule Order
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => {
                                    setDeliveredData({ agent: "", quantity: 1, amountPaid: "", deliveryFee: "", deliveryDate: new Date().toISOString().split("T")[0], soldBy: "", expenseName: "", expenseAmount: "" });
                                    setDeliveredItem(o);
                                  }}>
                                    Mark Delivered
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setStatusReasonItem({ item: o, status: "failed" })}>
                                    Mark Failed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatusReasonItem({ item: o, status: "cancelled" })}>
                                    Cancel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatusReasonItem({ item: o, status: "banned" })}>
                                    Ban Customer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatusReasonItem({ item: o, status: "deleted" })}>
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="font-semibold text-muted-foreground w-1/3">Name</span>
                  <span className="font-medium text-right">{viewItem.customerName || viewItem.name || "—"}</span>
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md group">
                  <span className="font-semibold text-muted-foreground w-1/3">Call Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{viewItem.callNumber || viewItem.phone || "—"}</span>
                    {(viewItem.callNumber || viewItem.phone) && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => handleCopy(viewItem.callNumber || viewItem.phone, "Call Number")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md group">
                  <span className="font-semibold text-muted-foreground w-1/3">WhatsApp</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{viewItem.whatsappNumber || viewItem.phone || "—"}</span>
                    {(viewItem.whatsappNumber || viewItem.phone) && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => handleCopy(viewItem.whatsappNumber || viewItem.phone, "WhatsApp Number")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md group">
                  <span className="font-semibold text-muted-foreground w-1/3">Address</span>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-medium text-right max-w-[200px] truncate" title={viewItem.address}>{viewItem.address || "—"}</span>
                    {viewItem.address && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 opacity-50 group-hover:opacity-100" onClick={() => handleCopy(viewItem.address, "Address")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="font-semibold text-muted-foreground w-1/3">Product</span>
                  <span className="font-medium text-right">{viewItem.product || viewItem.productName || "—"}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                <CallButton phone={viewItem.callNumber || viewItem.phone} />
                <WhatsAppButton phone={viewItem.whatsappNumber || viewItem.phone} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMMENT MODAL */}
      <Dialog open={!!commentItem} onOpenChange={(open) => !open && setCommentItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Comment / Note</Label>
            <Textarea 
              placeholder="Type your comment here..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentItem(null)}>Cancel</Button>
            <Button onClick={() => addComment.mutate()} disabled={!commentText.trim() || addComment.isPending}>
              {addComment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SCHEDULE MODAL */}
      <Dialog open={!!scheduleItem} onOpenChange={(open) => !open && setScheduleItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Delivery Address</Label>
              <Textarea 
                value={scheduleData.address} 
                onChange={(e) => setScheduleData({ ...scheduleData, address: e.target.value })}
                placeholder="Full delivery address"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input 
                type="number" 
                min={1} 
                value={scheduleData.quantity} 
                onChange={(e) => setScheduleData({ ...scheduleData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Schedule Date</Label>
              <Input 
                type="date" 
                value={scheduleData.scheduleDate} 
                onChange={(e) => setScheduleData({ ...scheduleData, scheduleDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Additional Notes</Label>
              <Input 
                value={scheduleData.notes} 
                onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                placeholder="e.g. Call before delivery"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleItem(null)}>Cancel</Button>
            <Button onClick={() => scheduleOrder.mutate()} disabled={!scheduleData.address.trim() || scheduleOrder.isPending}>
              {scheduleOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MARK DELIVERED MODAL */}
      <Dialog open={!!deliveredItem} onOpenChange={(open) => !open && setDeliveredItem(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark Order as Delivered</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Delivery Agent</Label>
                <Input value={deliveredData.agent} onChange={(e) => setDeliveredData({...deliveredData, agent: e.target.value})} placeholder="Agent Name" />
              </div>
              <div className="space-y-1.5">
                <Label>Sold By</Label>
                <Input value={deliveredData.soldBy} onChange={(e) => setDeliveredData({...deliveredData, soldBy: e.target.value})} placeholder="Sales Rep" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={deliveredData.quantity} onChange={(e) => setDeliveredData({...deliveredData, quantity: parseInt(e.target.value) || 1})} />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Date</Label>
                <Input type="date" value={deliveredData.deliveryDate} onChange={(e) => setDeliveredData({...deliveredData, deliveryDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount Paid by Customer</Label>
                <Input type="number" value={deliveredData.amountPaid} onChange={(e) => setDeliveredData({...deliveredData, amountPaid: e.target.value})} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Fee</Label>
                <Input type="number" value={deliveredData.deliveryFee} onChange={(e) => setDeliveredData({...deliveredData, deliveryFee: e.target.value})} placeholder="0" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <Label className="text-muted-foreground mb-2 block">Extra Expense (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Input value={deliveredData.expenseName} onChange={(e) => setDeliveredData({...deliveredData, expenseName: e.target.value})} placeholder="Expense Name" />
                </div>
                <div className="space-y-1.5">
                  <Input type="number" value={deliveredData.expenseAmount} onChange={(e) => setDeliveredData({...deliveredData, expenseAmount: e.target.value})} placeholder="Amount" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveredItem(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                updateStatus.mutate({ 
                  id: String(deliveredItem._id || deliveredItem.id), 
                  status: "delivered", 
                  payload: { ...deliveredData, amountPaid: Number(deliveredData.amountPaid), deliveryFee: Number(deliveredData.deliveryFee) }
                });
                setDeliveredItem(null);
              }} 
              disabled={!deliveredData.agent || updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Mark Delivered
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* STATUS REASON MODAL */}
      <Dialog open={!!statusReasonItem} onOpenChange={(open) => !open && setStatusReasonItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Mark as {statusReasonItem?.status}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Please provide a reason</Label>
            <Textarea 
              placeholder="Why are you making this change?" 
              value={statusReason} 
              onChange={(e) => setStatusReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusReasonItem(null); setStatusReason(""); }}>Cancel</Button>
            <Button 
              variant={statusReasonItem?.status === 'deleted' || statusReasonItem?.status === 'banned' ? 'destructive' : 'default'}
              onClick={() => {
                if (!statusReasonItem) return;
                updateStatus.mutate({ 
                  id: String(statusReasonItem.item._id || statusReasonItem.item.id), 
                  status: statusReasonItem.status, 
                  payload: { reason: statusReason }
                });
                setStatusReasonItem(null);
                setStatusReason("");
              }} 
              disabled={!statusReason.trim() || updateStatus.isPending}
            >
              {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ActivityTimelineDialog item={activityItem} onClose={() => setActivityItem(null)} />
    </div>
  );
}

function ActivityTimelineDialog({ item, onClose }: { item: any, onClose: () => void }) {
  const isOpen = !!item;
  const { data: activityData, isLoading } = useQuery({
    queryKey: ["orderActivity", item?._id || item?.id],
    queryFn: async () => (await apiActions.orders.getActivity(item?._id || item?.id)).data,
    enabled: isOpen,
  });

  const activities = Array.isArray(activityData) ? activityData : activityData?.data || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Activity</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading timeline...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground p-4">No activity recorded for this order yet.</div>
          ) : (
            <div className="space-y-4">
              {activities.map((act: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    {i !== activities.length - 1 && <div className="h-full w-px bg-border my-1" />}
                  </div>
                  <div className="flex flex-col pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{act.action.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{act.description}</p>
                    <span className="text-xs font-medium text-foreground mt-1">by {act.actorName || "System"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
