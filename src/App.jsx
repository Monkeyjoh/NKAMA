import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";
import MobileLayout from "@/layouts/MobileLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import BiensPage from "@/pages/BiensPage";
import BienDetailPage from "@/pages/BienDetailPage";
import CRMPage from "@/pages/CRMPage";
import FinancesPage from "@/pages/FinancesPage";
import PlusPage from "@/pages/PlusPage";
import MaintenancePage from "@/pages/MaintenancePage";
import LocatairesPage from "@/pages/LocatairesPage";
import LocataireDetailPage from "@/pages/LocataireDetailPage";
import PrestatairesPage from "@/pages/PrestatairesPage";
import ContratsPage from "@/pages/ContratsPage";
import ContratDetailPage from "@/pages/ContratDetailPage";
import ControlePage from "@/pages/ControlePage";
import ParametresPage from "@/pages/ParametresPage";
import UsersPage from "@/pages/UsersPage";
import ProfilePage from "@/pages/ProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";

/**
 * NKAMA — Routes de l'application.
 *
 * <AuthProvider> englobe tout. Les pages applicatives sont protégées par
 * <ProtectedRoute> (en mode mock, l'accès est libre via le profil démo).
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MobileLayout />}>
              {/* Accessible à tous les rôles (l'agent voit ses biens affectés) */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/biens" element={<BiensPage />} />
              <Route path="/biens/:id" element={<BienDetailPage />} />
              <Route path="/plus" element={<PlusPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Réservé propriétaire / administrateur */}
              <Route element={<RoleRoute roles={["owner", "admin"]} />}>
                <Route path="/crm" element={<CRMPage />} />
                <Route path="/finances" element={<FinancesPage />} />
                <Route path="/locataires" element={<LocatairesPage />} />
                <Route path="/locataires/:id" element={<LocataireDetailPage />} />
                <Route path="/prestataires" element={<PrestatairesPage />} />
                <Route path="/contrats" element={<ContratsPage />} />
                <Route path="/contrats/:id" element={<ContratDetailPage />} />
                <Route path="/controle" element={<ControlePage />} />
                <Route path="/parametres" element={<ParametresPage />} />
                <Route path="/utilisateurs" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
