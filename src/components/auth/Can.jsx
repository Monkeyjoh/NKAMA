import { usePermissions } from "@/hooks/usePermissions";

/**
 * NKAMA — Garde de permission au niveau UI.
 * Affiche `children` seulement si le rôle courant peut réaliser `action`.
 * @param {{ action: string, fallback?: React.ReactNode, children: React.ReactNode }} props
 */
export default function Can({ action, fallback = null, children }) {
  const { can } = usePermissions();
  return can(action) ? <>{children}</> : <>{fallback}</>;
}
