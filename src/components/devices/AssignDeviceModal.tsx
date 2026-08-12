import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function AssignDeviceModal({
  open,
  onOpenChange,
  deviceId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  onSuccess: () => void;
}) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [reason, setReason] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await apiActions.users.list()).data,
    enabled: open,
  });

  const users = Array.isArray(usersData) ? usersData : usersData?.data || [];
  // Filter only active users or specific roles if needed
  const availableUsers = users.filter((u: any) => u.status !== 'suspended');

  const handleAssign = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }
    setAssigning(true);
    try {
      await apiActions.devices.assign(deviceId, { userId: selectedUser, reason });
      toast.success("Device assigned successfully!");
      onSuccess();
    } catch (e: any) {
      toast.error(e.friendlyMessage || "Failed to assign device");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Device</DialogTitle>
          <DialogDescription>
            Select an employee to assign this device to. This will end any current assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            {isLoading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading users...
              </div>
            ) : (
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">-- Select an employee --</option>
                {availableUsers.map((u: any) => (
                  <option key={u._id || u.id} value={String(u._id || u.id)}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason / Notes (Optional)</Label>
            <Input 
              placeholder="e.g., New hire, Replacement, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={assigning || !selectedUser}>
            {assigning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Assign Device
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
