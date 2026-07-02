import { Outlet } from "react-router-dom";
import { S } from "@/styles/sharedStyles";
import BottomNav from "@/components/layout/BottomNav";

/**
 * NKAMA — Gabarit mobile principal.
 *
 * Fournit le conteneur centré (max 480px) et la barre de navigation basse
 * partagée par toutes les pages. Chaque page rend son propre header/contenu
 * via <Outlet />.
 */
export default function MobileLayout() {
  return (
    <div style={S.app}>
      <Outlet />
      <BottomNav />
    </div>
  );
}
