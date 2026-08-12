import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Loader2, Laptop, Lock, Unlock, Eraser, UserPlus, UserMinus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { AssignDeviceModal } from "@/components/devices/AssignDeviceModal";
import { DeviceActionDialog } from "@/components/devices/DeviceActionDialog";

export const Route = createFileRoute("/_authenticated/devices/$id")({
  component: DeviceDetailsPage,
});

function DeviceDetailsPage() {
  const { id } = Route.useParams();
  const [actionType, setActionType] = useState<"LOCK" | "UNLOCK" | "WIPE" | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["device", id],
    queryFn: async () => (await apiActions.devices.get(id)).data,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.device) {
    return <div>Device not found.</div>;
  }

  const { device, activeAssignment, assignments } = data;

  const handleActionConfirm = async (reason: string) => {
    try {
      if (actionType === "LOCK") {
        await apiActions.devices.lock(id, { reason });
        toast.success("Lock command sent successfully.");
      } else if (actionType === "UNLOCK") {
        await apiActions.devices.unlock(id, { reason });
        toast.success("Unlock command sent successfully.");
      } else if (actionType === "WIPE") {
        await apiActions.devices.wipe(id, { reason });
        toast.success("Wipe command sent successfully.");
      }
      refetch();
    } catch (e: any) {
      toast.error(e.friendlyMessage || "Action failed");
    } finally {
      setActionType(null);
    }
  };

  const handleUnassign = async () => {
    if (!confirm("Are you sure you want to unassign this device?")) return;
    try {
      await apiActions.devices.unassign(id);
      toast.success("Device unassigned.");
      refetch();
    } catch (e: any) {
      toast.error(e.friendlyMessage || "Failed to unassign");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={device.name || "Unknown Device"} 
        description={`Serial: ${device.serialNumber || 'N/A'}`}
        backTo="/devices" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Laptop className="h-5 w-5 mr-2" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
                <StatusBadge status={device.status} />
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Platform</p>
                <p className="font-medium">{device.type} {device.osVersion && `(${device.osVersion})`}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Manufacturer</p>
                <p className="font-medium">{device.manufacturer || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Model</p>
                <p className="font-medium">{device.model || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Fleet Host ID</p>
                <p className="font-mono text-xs p-1 bg-muted rounded inline-block">{device.fleetHostId || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Last Seen</p>
                <p className="font-medium">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={() => setActionType("LOCK")}
                disabled={device.status === 'LOCKED'}
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock Device
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => setActionType("UNLOCK")}
                disabled={device.status !== 'LOCKED'}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Device
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setActionType("WIPE")}
              >
                <Eraser className="h-4 w-4 mr-2" />
                Wipe Device
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAssignment ? (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Currently Assigned To</p>
                    <p className="font-medium text-sm mt-1">{activeAssignment.userId?.name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{activeAssignment.userId?.email}</p>
                  </div>
                  <Button variant="outline" className="w-full text-destructive" onClick={handleUnassign}>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unassign
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md text-center">
                    <p className="text-sm text-muted-foreground">Device is unassigned.</p>
                  </div>
                  <Button variant="default" className="w-full" onClick={() => setAssignModalOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign to User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeviceActionDialog 
        open={actionType !== null} 
        onOpenChange={(open) => !open && setActionType(null)}
        action={actionType}
        deviceName={device.name}
        onConfirm={handleActionConfirm}
      />

      <AssignDeviceModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        deviceId={id}
        onSuccess={() => {
          setAssignModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
