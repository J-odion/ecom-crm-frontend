import { useAuth } from "@/lib/auth";

interface PermissionGateProps {
  children: React.ReactNode;
  allowedPermissions: string[] | string;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * PermissionGate component to conditionally render content based on the current user's permissions.
 *
 * @param allowedPermissions - A string or array of strings representing required permissions.
 * @param requireAll - If true, the user must have ALL listed permissions. If false (default), they only need ONE.
 * @param fallback - Content to render if the user does not have permission.
 */
export function PermissionGate({ children, allowedPermissions, fallback = null, requireAll = false }: PermissionGateProps) {
  const { user } = useAuth();
  
  if (!user) return <>{fallback}</>;
  
  // If the user has a wildcard '*' permission (e.g. dev mock admin), they are allowed everything.
  if (user.permissions?.includes("*")) return <>{children}</>;

  const requiredPerms = Array.isArray(allowedPermissions) ? allowedPermissions : [allowedPermissions];
  const userPerms = user.permissions || [];
  
  const hasAccess = requireAll
    ? requiredPerms.every(p => userPerms.includes(p))
    : requiredPerms.some(p => userPerms.includes(p));
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}
