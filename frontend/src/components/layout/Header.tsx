import { Menu } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { NotificationsPanel } from "../../features/notifications/NotificationsPanel";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Button } from "../ui/Button";

const titleMap: Record<string, string> = {
  "/": "Tableau de bord",
  "/reservations": "Réservations",
  "/demandes": "Demandes de réservation",
  "/conflits": "Conflits",
  "/vehicules": "Véhicules",
  "/utilisateurs": "Utilisateurs",
  "/localisations": "Localisations",
  "/droits": "Droits",
  "/informations-utilisateurs": "Informations utilisateurs",
  "/informations-vehicules": "Informations véhicules",
  "/commentaires": "Commentaires véhicule",
  "/historique": "Historique kilométrique",
  "/informations-personnelles": "Mes informations"
};

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const title = useMemo(() => titleMap[location.pathname] ?? "RSVéhicule", [location.pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-[rgba(246,249,252,0.85)] px-4 py-4 backdrop-blur dark:bg-[rgba(12,18,24,0.9)] lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-xl border border-border bg-surface p-2 text-soft lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-soft">Flotte UFCV</p>
            <h1 className="break-words text-lg font-semibold leading-tight text-app sm:text-xl">{title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden lg:flex" />
          <NotificationsPanel />
          <div className="hidden rounded-xl border border-border bg-surface px-3 py-2 md:block">
            <p className="text-sm font-medium text-app">{user?.fullName}</p>
            <p className="text-xs text-soft">{user?.roles[0]?.name ?? "Utilisateur"}</p>
          </div>
          <Button variant="secondary" className="hidden lg:inline-flex" onClick={() => void logout()}>
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
