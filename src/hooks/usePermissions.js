import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { can, canManageUser, canActOnUser, creatableRoles } from "@/lib/permissions";

/**
 * NKAMA — Hook de permissions (dérivé de useAuth).
 * Fournit `can(action)` et des aides de gestion des utilisateurs.
 */
export function usePermissions() {
  const { role } = useAuth();
  return useMemo(
    () => ({
      role,
      isOwner: role === "owner",
      isAdmin: role === "admin",
      isAgent: role === "agent",
      can: (action) => can(role, action),
      canManageUser: (targetRole) => canManageUser(role, targetRole),
      canActOnUser: (targetRole) => canActOnUser(role, targetRole),
      creatableRoles: () => creatableRoles(role),
    }),
    [role]
  );
}
