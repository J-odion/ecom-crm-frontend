import { Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown } from "lucide-react";
import { ROLE_LABEL } from "@/lib/api";

export function AppShell() {
  const { user, logout, setRoleOverride } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {(user?.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-xs font-medium">{user?.email}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {user?.role ? ROLE_LABEL[user.role] : ""}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* ROLE SWITCHER FOR DEV TESTING */}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground pt-3">
                  Dev: Switch Role
                </DropdownMenuLabel>
                {(Object.entries(ROLE_LABEL) as [any, string][]).map(([r, label]) => (
                  <DropdownMenuItem 
                    key={r} 
                    onClick={() => setRoleOverride(r)}
                    className={user?.role === r ? "bg-accent font-medium" : ""}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate({ to: "/login" });
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
