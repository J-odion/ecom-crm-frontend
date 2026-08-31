import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Coins, Loader2, Users, Target, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { FinancialFilterBar, type FinancialFilters } from "@/components/financial-filter-bar";

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Ecom CRM" }] }),
  component: EarningsPage,
});

function EarningsPage() {
  const { user } = useAuth();
  const isAdminOrAccountant = user?.role === "admin" || user?.role === "accountant";
  
  const [filters, setFilters] = useState<FinancialFilters>({});

  const queryParams = new URLSearchParams();
  if (filters.date) queryParams.set("date", filters.date);
  if (filters.startDate) queryParams.set("startDate", filters.startDate);
  if (filters.endDate) queryParams.set("endDate", filters.endDate);
  if (filters.state) queryParams.set("state", filters.state);
  if (filters.officeId) queryParams.set("officeId", filters.officeId);
  if (filters.productId) queryParams.set("productId", filters.productId);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const { data: myEarningsData, isLoading: myLoading } = useQuery({
    queryKey: ["earnings", "me", filters],
    queryFn: async () => (await api.get(`/earnings/me${queryString}`)).data,
  });

  const { data: staffEarningsData, isLoading: staffLoading } = useQuery({
    queryKey: ["earnings", "staff", filters],
    queryFn: async () => (await api.get(`/earnings/staff${queryString}`)).data,
    enabled: isAdminOrAccountant,
  });

  const { data: agentsEarningsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["earnings", "agents", filters],
    queryFn: async () => (await api.get(`/earnings/agents${queryString}`)).data,
    enabled: isAdminOrAccountant,
  });

  const { data: referralsEarningsData, isLoading: referralsLoading } = useQuery({
    queryKey: ["earnings", "referrals", filters],
    queryFn: async () => (await api.get(`/earnings/referrals${queryString}`)).data,
    enabled: isAdminOrAccountant,
  });

  const myEarnings = myEarningsData?.earnings ?? 0;
  const staffEarnings = staffEarningsData?.earnings ?? 0;
  const agentEarnings = agentsEarningsData?.earnings ?? 0;
  const referralEarnings = referralsEarningsData?.earnings ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Earnings & Commissions" 
        description="Track user commissions and payout balances." 
      />
      
      <FinancialFilterBar filters={filters} onChange={setFilters} />

      <h3 className="text-lg font-semibold tracking-tight mt-8 mb-4">My Earnings</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {myLoading ? (
           <div className="h-32 rounded-xl bg-muted animate-pulse flex items-center justify-center">
             <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
           </div>
        ) : (
          <StatCard 
            label="Total Earnings" 
            value={`₦${Number(myEarnings).toLocaleString()}`} 
            icon={Coins} 
            accent="success" 
          />
        )}
      </div>

      {isAdminOrAccountant && (
        <>
          <h3 className="text-lg font-semibold tracking-tight mt-10 mb-4">Organization Earnings</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {staffLoading ? (
               <div className="h-32 rounded-xl bg-muted animate-pulse flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <StatCard 
                label="Staff Earnings" 
                value={`₦${Number(staffEarnings).toLocaleString()}`} 
                icon={Briefcase} 
                accent="primary"
                subtext="Customer Service & Logistics Managers"
              />
            )}
            
            {agentsLoading ? (
               <div className="h-32 rounded-xl bg-muted animate-pulse flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <StatCard 
                label="Agent Earnings" 
                value={`₦${Number(agentEarnings).toLocaleString()}`} 
                icon={Users} 
                accent="warning"
                subtext="Dispatch Riders"
              />
            )}

            {referralsLoading ? (
               <div className="h-32 rounded-xl bg-muted animate-pulse flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <StatCard 
                label="Referral Earnings" 
                value={`₦${Number(referralEarnings).toLocaleString()}`} 
                icon={Target} 
                accent="destructive"
                subtext="Media Buyers"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
