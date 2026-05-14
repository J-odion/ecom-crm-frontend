import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiActions } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Plus, Loader2, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/role-gate";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/locations")({
  head: () => ({ meta: [{ title: "Locations — Ecom CRM" }] }),
  component: LocationsPage,
});

function LocationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await apiActions.locations.list()).data,
  });

  const locations: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage your offices and warehouses across the country."
        actions={
          <RoleGate allowedRoles={["admin"]}>
            <CreateLocationDialog onDone={() => qc.invalidateQueries({ queryKey: ["locations"] })} />
          </RoleGate>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/50">
              <div className="h-32" />
            </Card>
          ))
        ) : locations.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={MapPin}
              title="No locations yet"
              description="Add your first office or warehouse to start tracking stock."
            />
          </div>
        ) : (
          locations.map((loc) => (
            <LocationCard key={loc.id || loc._id} location={loc} />
          ))
        )}
      </div>
    </div>
  );
}

function LocationCard({ location }: { location: any }) {
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => apiActions.locations.delete(location.id || location._id),
    onSuccess: () => {
      toast.success("Location deleted");
      qc.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete"),
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <RoleGate allowedRoles={["admin"]}>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                if (confirm("Are you sure you want to delete this location?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </RoleGate>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-lg">{location.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {location.address || "No address provided"}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between text-xs font-medium">
          <span className="rounded-full bg-muted px-2 py-1 uppercase tracking-wider text-muted-foreground">
            {location.type || "Office"}
          </span>
          <span className="text-muted-foreground">
            {location.stockCount || 0} Products
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateLocationDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("OFFICE");

  const create = useMutation({
    mutationFn: () => apiActions.locations.create({ name, address, type }),
    onSuccess: () => {
      toast.success("Location created");
      setOpen(false);
      setName("");
      setAddress("");
      onDone();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Location Name</Label>
            <Input
              id="loc-name"
              placeholder="e.g. Lagos Warehouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc-address">Address</Label>
            <Input
              id="loc-address"
              placeholder="e.g. 123 Ikeja Way, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2">
              {["OFFICE", "WAREHOUSE"].map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={type === t ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
