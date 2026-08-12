import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Wallet,
  Boxes,
  ClipboardList,
  Megaphone,
  ReceiptText,
  Percent,
  UserCog,
  Settings,
  Package,
  MapPin,
  Code2,
  History,
  Laptop,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[] | "all";
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: "all" },
    ],
  },
  {
    group: "Sales",
    items: [
      {
        to: "/leads",
        label: "Leads",
        icon: ClipboardList,
        roles: ["customer_service", "admin", "dev", "customer_service_manager", "logistics_manager", "marketing_manager"],
      },
      { to: "/lead-forms", label: "Lead Forms", icon: Code2, roles: "all" },
      {
        to: "/orders",
        label: "Orders",
        icon: ShoppingCart,
        roles: ["customer_service", "admin", "dev", "customer_service_manager", "logistics", "logistics_manager", "accountant", "delivery_agent"],
      },
      {
        to: "/media-buyer",
        label: "Media Buyer",
        icon: Megaphone,
        roles: ["sales_agent", "media_buyer", "admin", "dev", "marketing_manager"],
      },
    ],
  },
  {
    group: "Operations",
    items: [
      {
        to: "/deliveries",
        label: "Deliveries",
        icon: Truck,
        roles: ["logistics", "logistics_manager", "delivery_agent", "admin", "dev"],
      },
      { to: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "dev", "logistics", "logistics_manager"] },
      { to: "/products", label: "Products", icon: Package, roles: "all" },
      { to: "/locations", label: "Locations", icon: MapPin, roles: ["admin", "dev", "logistics", "logistics_manager"] },
    ],
  },
  {
    group: "Finance",
    items: [
      { to: "/accountant", label: "Remittance", icon: ReceiptText, roles: ["accountant", "admin", "dev"] },
      { to: "/finance", label: "Finance", icon: Wallet, roles: ["admin", "dev", "accountant"] },
      { to: "/commission-rules", label: "Commission Rules", icon: Percent, roles: ["admin", "dev"] },
    ],
  },
  {
    group: "Admin",
    items: [
      { to: "/users", label: "Users", icon: Users, roles: ["admin", "dev", "manager", "accountant"] },
      { to: "/audit-trail", label: "Audit Trail", icon: History, roles: ["admin", "dev"] },
      { to: "/devices", label: "Devices", icon: Laptop, roles: ["admin", "dev", "management"] },
      { to: "/settings", label: "Settings", icon: Settings, roles: "all" },
    ],
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role;
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            E
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">EcomCRM</span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
              Operations Suite
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => {
          const items = group.items.filter(
            (i) => i.roles === "all" || (role && i.roles.includes(role)),
          );
          if (!items.length) return null;
          return (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active =
                      item.to === "/"
                        ? path === "/"
                        : path === item.to || path.startsWith(item.to + "/");
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link to={item.to} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
