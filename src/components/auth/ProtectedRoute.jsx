import { Navigate, Outlet } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import { useAuth } from "@/hooks/useAuth";

/**
 * Garde de route : exige une session quand Supabase est configuré.
 * En mode mock, l'accès est toujours autorisé (profil de démonstration).
 */
export default function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ ...S.app, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--ink-soft)", fontFamily: "Helvetica Neue, Arial, sans-serif", fontSize: 14 }}>
          Chargement…
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
