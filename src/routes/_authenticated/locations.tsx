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
import { PermissionGate } from "@/components/permission-gate";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/locations")({
  head: () => ({ meta: [{ title: "Locations — Ecom CRM" }] }),
  component: LocationsPage,
});

function LocationsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const { data, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await apiActions.locations.list()).data,
  });

  const locations: any[] = Array.isArray(data) ? data : data?.data || [];
  
  const filteredLocations = activeTab === "ALL" 
    ? locations 
    : locations.filter(loc => (loc.type || "OFFICE").toUpperCase() === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage your offices and warehouses across the country."
        actions={
          <PermissionGate allowedPermissions={["locations:manage"]}>
            <CreateLocationDialog onDone={() => qc.invalidateQueries({ queryKey: ["locations"] })} />
          </PermissionGate>
        }
      />

      <div className="flex justify-start">
        <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "ALL" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("OFFICE")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "OFFICE" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Offices
          </button>
          <button
            onClick={() => setActiveTab("WAREHOUSE")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === "WAREHOUSE" ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"}`}
          >
            Warehouses
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted/50">
              <div className="h-32" />
            </Card>
          ))
        ) : filteredLocations.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={MapPin}
              title={`No ${activeTab === "ALL" ? "locations" : activeTab.toLowerCase() + "s"} yet`}
              description="Add your first location to start tracking stock."
            />
          </div>
        ) : (
          filteredLocations.map((loc) => (
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
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to delete"),
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <PermissionGate allowedPermissions={["locations:delete"]}>
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
          </PermissionGate>
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

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

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
    onError: (e: any) => toast.error(e.friendlyMessage || "Failed to create"),
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
            <Label htmlFor="loc-state">State</Label>
            <select
              id="loc-state"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            >
              <option value="">Select a state...</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
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
          <Button onClick={() => create.mutate()} disabled={!name || !address || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
