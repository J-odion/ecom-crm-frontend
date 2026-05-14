import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: Role[] | Role;
  fallback?: React.ReactNode;
}

/**
 * RoleGate component to conditionally render content based on the current user's role.
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { user } = useAuth();
  
  if (!user) return <>{fallback}</>;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (roles.includes(user.role)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
