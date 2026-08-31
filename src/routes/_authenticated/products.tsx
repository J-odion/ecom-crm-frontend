import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Package, Loader2 } from "lucide-react";
import { NewProductDialog } from "./inventory";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({ meta: [{ title: "Products — Ecom CRM" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });
  const items: any[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog used across orders and leads."
        actions={<NewProductDialog endpoint="/products" onDone={() => qc.invalidateQueries({ queryKey: ["products"] })} />}
      />
      {isLoading ? (
        <Card><CardContent className="flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</CardContent></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} title="No products" description="Add a product to make it available to sales and CS." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Card key={p._id || p.id || i}>
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground">{p.name || p.productName}</h3>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Stock" value={p.stock ?? p.quantity ?? "—"} />
                  <Stat label="Cost" value={p.cost ? `₦${Number(p.cost).toLocaleString()}` : "—"} />
                  <Stat label="Price" value={p.price ? `₦${Number(p.price).toLocaleString()}` : "—"} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
