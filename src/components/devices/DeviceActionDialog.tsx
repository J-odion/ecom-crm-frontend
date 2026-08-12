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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";

export function DeviceActionDialog({
  open,
  onOpenChange,
  action,
  deviceName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "LOCK" | "UNLOCK" | "WIPE" | null;
  deviceName: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const getActionDetails = () => {
    switch (action) {
      case "LOCK":
        return {
          title: "Lock Device",
          desc: `Are you sure you want to lock ${deviceName}? The user will be locked out until it is explicitly unlocked.`,
          btnClass: "bg-orange-600 hover:bg-orange-700 text-white",
          btnText: "Lock Device",
        };
      case "UNLOCK":
        return {
          title: "Unlock Device",
          desc: `This will remove the lock from ${deviceName} and restore normal access.`,
          btnClass: "bg-green-600 hover:bg-green-700 text-white",
          btnText: "Unlock Device",
        };
      case "WIPE":
        return {
          title: "WIPE DEVICE",
          desc: `WARNING: This will permanently erase all data on ${deviceName}. This action cannot be undone.`,
          btnClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
          btnText: "Wipe Device",
          isDanger: true,
        };
      default:
        return { title: "", desc: "", btnClass: "", btnText: "" };
    }
  };

  const details = getActionDetails();

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(reason);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={details.isDanger ? "text-destructive flex items-center" : ""}>
            {details.isDanger && <AlertTriangle className="h-5 w-5 mr-2" />}
            {details.title}
          </DialogTitle>
          <DialogDescription>{details.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Audit Reason (Required)</Label>
            <Input 
              placeholder="Why are you performing this action?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            className={details.btnClass} 
            onClick={handleConfirm} 
            disabled={loading || reason.trim() === ""}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {details.btnText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
