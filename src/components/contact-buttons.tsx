import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export function CallButton({ phone }: { phone?: string | null }) {
  if (!phone) return null;
  return (
    <Button asChild size="sm" variant="outline">
      <a href={`tel:${phone}`}>
        <Phone className="h-4 w-4 mr-1.5" /> Call
      </a>
    </Button>
  );
}

export function WhatsAppButton({ phone }: { phone?: string | null }) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d]/g, "");
  return (
    <Button asChild size="sm" variant="outline" className="text-success border-success/40 hover:bg-success/10">
      <a href={`https://wa.me/${cleaned}`} target="_blank" rel="noreferrer">
        <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
      </a>
    </Button>
  );
}

export function CopyOrderButton({ order }: { order: any }) {
  const onCopy = async () => {
    const text = [
      `Customer Name: ${order?.customerName || order?.customer_name || order?.name || "-"}`,
      `Phone: ${order?.phone || order?.customerPhone || "-"}`,
      `Address: ${order?.address || order?.deliveryAddress || "-"}`,
      `Product: ${order?.product || order?.productName || "-"}`,
      `Quantity: ${order?.quantity ?? order?.qty ?? 1}`,
      `Order Amount: ${order?.amount ?? order?.totalAmount ?? "-"}`,
      `Delivery Type: ${order?.deliveryType || order?.delivery_type || "-"}`,
      `Notes: ${order?.notes || "-"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Order details copied");
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <Button size="sm" variant="secondary" onClick={onCopy}>
      <Copy className="h-4 w-4 mr-1.5" /> Copy Order
    </Button>
  );
}
