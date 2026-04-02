import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { CommentsPage } from "../features/comments/CommentsPage";
import { ConflictsPage } from "../features/conflicts/ConflictsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { LoginPage } from "../features/auth/LoginPage";
import { UserInfosPage } from "../features/infos/UserInfosPage";
import { VehicleInfosPage } from "../features/infos/VehicleInfosPage";
import { LocationsPage } from "../features/locations/LocationsPage";
import { OdometerPage } from "../features/odometer/OdometerPage";
import { PermissionsPage } from "../features/permissions/PermissionsPage";
import { ReservationRequestsPage } from "../features/requests/ReservationRequestsPage";
import { ReservationsPage } from "../features/reservations/ReservationsPage";
import { ThemeProvider } from "../theme/ThemeProvider";
import { PersonalProfilePage } from "../features/users/PersonalProfilePage";
import { UsersPage } from "../features/users/UsersPage";
import { ScanVehiclePage } from "../features/vehicles/ScanVehiclePage";
import { VehicleDetailPage } from "../features/vehicles/VehicleDetailPage";
import { VehiclesPage } from "../features/vehicles/VehiclesPage";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-soft">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppShell />;
}

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-soft">
        <h1 className="text-3xl font-semibold text-app">Politique de confidentialité</h1>
        <p className="mt-4 text-sm text-soft">
          RSVéhicule traite uniquement les données nécessaires à la gestion de la flotte UFCV :
          identité professionnelle, réservations, droits, pièces justificatives et historique
          kilométrique. Aucun cookie de tracking ni outil publicitaire n’est utilisé.
        </p>
        <p className="mt-4 text-sm text-soft">
          Les accès sont protégés par authentification et permissions métier. Les actions
          sensibles sont journalisées à des fins d’audit interne.
        </p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
              <Route path="/confidentialite" element={<PrivacyPage />} />
              <Route path="/vehicules/scan/:slug" element={<ScanVehiclePage />} />
              <Route element={<ProtectedLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="/reservations" element={<ReservationsPage />} />
                <Route path="/demandes" element={<ReservationRequestsPage />} />
                <Route path="/conflits" element={<ConflictsPage />} />
                <Route path="/vehicules" element={<VehiclesPage />} />
                <Route path="/vehicules/:vehicleId" element={<VehicleDetailPage />} />
                <Route path="/utilisateurs" element={<UsersPage />} />
                <Route path="/localisations" element={<LocationsPage />} />
                <Route path="/droits" element={<PermissionsPage />} />
                <Route path="/informations-utilisateurs" element={<UserInfosPage />} />
                <Route path="/informations-vehicules" element={<VehicleInfosPage />} />
                <Route path="/commentaires" element={<CommentsPage />} />
                <Route path="/historique" element={<OdometerPage />} />
                <Route path="/informations-personnelles" element={<PersonalProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
