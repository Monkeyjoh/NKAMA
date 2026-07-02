import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * NKAMA — Garde de route par rôle.
 * Réservé aux rôles listés (sinon redirection vers l'accueil).
 * @param {{ roles: string[] }} props
 */
export default function RoleRoute({ roles = ["owner", "admin"] }) {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
