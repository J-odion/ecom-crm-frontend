import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search } from "lucide-react";

export type FinancialFilters = {
  date?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  officeId?: string;
  productId?: string;
};

interface Props {
  filters: FinancialFilters;
  onChange: (filters: FinancialFilters) => void;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export function FinancialFilterBar({ filters, onChange }: Props) {
  const { data: locationsData } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await api.get("/locations")).data,
  });
  const locations: any[] = Array.isArray(locationsData) ? locationsData : locationsData?.data || [];
  const offices = locations.filter(l => l.type === "OFFICE" || !l.type);

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data,
  });
  const products: any[] = Array.isArray(productsData) ? productsData : productsData?.data || [];

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <Select value={filters.date || "all"} onValueChange={(v) => onChange({ ...filters, date: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="this_week">This Week</SelectItem>
          <SelectItem value="last_week">Last Week</SelectItem>
          <SelectItem value="this_month">This Month</SelectItem>
          <SelectItem value="last_month">Last Month</SelectItem>
          <SelectItem value="custom">Custom...</SelectItem>
        </SelectContent>
      </Select>

      {filters.date === "custom" && (
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            className="w-[130px] h-9" 
            value={filters.startDate || ""} 
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input 
            type="date" 
            className="w-[130px] h-9" 
            value={filters.endDate || ""} 
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
          />
        </div>
      )}

      <Select value={filters.state || "all"} onValueChange={(v) => onChange({ ...filters, state: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="All States" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All States</SelectItem>
          {NIGERIAN_STATES.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.officeId || "all"} onValueChange={(v) => onChange({ ...filters, officeId: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Offices" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Offices</SelectItem>
          {offices.map(o => (
            <SelectItem key={o._id || o.id} value={o._id || o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.productId || "all"} onValueChange={(v) => onChange({ ...filters, productId: v === "all" ? undefined : v })}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Products</SelectItem>
          {products.map(p => (
            <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
