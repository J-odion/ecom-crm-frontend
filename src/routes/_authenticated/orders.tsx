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

function OrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [scheduleSubTab, setScheduleSubTab] = useState("today");

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
  const [statusReasonItem, setStatusReasonItem] = useState<{ item: any, status: string, isLead: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const isLeadTab = activeTab === "pending" || activeTab === "abandoned";

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await apiActions.leads.list()).data,
    enabled: isLeadTab,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data,
    enabled: !isLeadTab,
  });

  const isLoading = isLeadTab ? loadingPending : loadingOrders;
  const rawData = isLeadTab 
    ? (Array.isArray(pendingData) ? pendingData : pendingData?.data || [])
    : (Array.isArray(ordersData) ? ordersData : ordersData?.data || []);

  // For lead tabs we filter leads by status. For other tabs we filter orders by status
  let currentData = isLeadTab 
    ? rawData.filter((o: any) => {
        const s = (o.status || "pending").toLowerCase();
        if (activeTab === "abandoned") return s === "abandoned";
        return s !== "abandoned"; 
      })
    : rawData.filter((o: any) => (o.status || o.deliveryStatus)?.toLowerCase() === activeTab);

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

  const filtered = currentData.filter((o: any) =>
    JSON.stringify(o).toLowerCase().includes(q.toLowerCase())
  );

  // --- Mutations ---
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, isLead, payload }: { id: string; status: string; isLead: boolean, payload?: any }) => {
      if (isLead) {
        return (await apiActions.leads.updateStatus(id, status)).data;
      }
      return (await api.patch(`/orders/${id}/delivery-status`, { status, ...payload })).data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Marked as ${variables.status}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to update status"),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const id = commentItem._id || commentItem.id;
      const isLead = isPendingTab || commentItem.customerName; // roughly
      if (isLead) {
        return (await apiActions.leads.updateStatus(id, commentItem.status || "contacted")).data;
      } else {
        return (await apiActions.orders.followUp(id, { notes: commentText })).data;
      }
    },
    onSuccess: () => {
      toast.success("Comment added");
      setCommentItem(null);
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to add comment"),
  });

  const scheduleOrder = useMutation({
    mutationFn: async () => {
      const leadId = scheduleItem._id || scheduleItem.id;
      return (await apiActions.orders.create({
        leadId,
        customerName: scheduleItem.customerName || scheduleItem.name,
        callNumber: scheduleItem.callNumber || scheduleItem.phone,
        whatsappNumber: scheduleItem.whatsappNumber || scheduleItem.phone,
        product: scheduleItem.productName || scheduleItem.product,
        quantity: scheduleData.quantity,
        address: scheduleData.address,
        deliveryType: "in_house",
        status: "scheduled",
        notes: scheduleData.notes,
        scheduleDate: new Date(scheduleData.scheduleDate).toISOString(),
      })).data;
    },
    onSuccess: () => {
      toast.success("Order scheduled successfully");
      setScheduleItem(null);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to schedule order"),
  });


  if (user?.role === "sales_agent" || user?.role === "media_buyer") {
    return <UnauthorizedView />;
  }

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
            {STATUS_TABS.map(tab => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="w-full sm:max-w-xs shrink-0">
          <Input placeholder="Search name, phone, product..." value={q} onChange={(e) => setQ(e.target.value)} />
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
                    <th className="px-4 py-3 text-left">ID / Ref</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    {!isLeadTab && <th className="px-4 py-3 text-left">Amount</th>}
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o: any, i: number) => {
                    const id = o._id || o.id || i;
                    const custName = o.customerName || o.name || "—";
                    const isLead = isLeadTab;

                    return (
                      <tr key={id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          #{String(id).slice(-6)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{custName}</span>
                            <span className="text-[11px] text-muted-foreground">{o.callNumber || o.phone || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{o.product || o.productName || "—"}</td>
                        {!isLeadTab && (
                          <td className="px-4 py-3">{o.amount ? `₦${Number(o.amount).toLocaleString()}` : "—"}</td>
                        )}
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status || o.deliveryStatus || (isLead ? "pending" : "")} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setViewItem(o)}>
                              View
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
                                    setScheduleData({ address: o.address || "", quantity: 1, notes: "" });
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
                                <DropdownMenuItem onClick={() => setStatusReasonItem({ item: o, status: "failed", isLead })}>
                                  Mark Failed
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatusReasonItem({ item: o, status: "cancelled", isLead })}>
                                  Cancel
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatusReasonItem({ item: o, status: "banned", isLead })}>
                                  Ban Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatusReasonItem({ item: o, status: "deleted", isLead })}>
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
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
                  isLead: isLeadTab,
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
                  isLead: statusReasonItem.isLead,
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
    </div>
  );
}
