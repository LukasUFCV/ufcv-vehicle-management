import {
  AlertTriangle,
  CarFront,
  FileText,
  Gauge,
  Home,
  KeyRound,
  MapPin,
  MessageSquareMore,
  ShieldCheck,
  UserCircle2,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UfcvLogo } from "../ui/UfcvLogo";

const navigation = [
  { to: "/", label: "Tableau de bord", icon: Home },
  { to: "/reservations", label: "Réservations", icon: FileText },
  { to: "/demandes", label: "Demandes", icon: ShieldCheck },
  { to: "/conflits", label: "Conflits", icon: AlertTriangle },
  { to: "/vehicules", label: "Véhicules", icon: CarFront },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/localisations", label: "Localisations", icon: MapPin },
  { to: "/droits", label: "Droits", icon: KeyRound },
  { to: "/informations-utilisateurs", label: "Infos utilisateurs", icon: UserCircle2 },
  { to: "/informations-vehicules", label: "Infos véhicules", icon: FileText },
  { to: "/commentaires", label: "Commentaires", icon: MessageSquareMore },
  { to: "/historique", label: "Historique km", icon: Gauge },
  { to: "/informations-personnelles", label: "Mes informations", icon: UserCircle2 }
];

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
  onAction?: () => void;
};

export function Sidebar({ mobile = false, onNavigate, onAction }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col gap-6",
        mobile ? "overflow-y-auto p-4" : "overflow-y-auto p-6"
      )}
    >
      <div className="glass-panel-strong rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          <UfcvLogo className="h-12 w-12" imageClassName="scale-[0.96]" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-soft">UFCV</p>
            <p className="text-lg font-semibold text-app">RSVéhicule</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={mobile ? onNavigate : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-500 !text-white shadow-soft hover:bg-brand-600 hover:!text-white dark:bg-brand-700 dark:hover:bg-brand-600"
                    : "text-soft hover:bg-white/55 hover:text-app dark:hover:bg-white/5"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 text-current" />
              <span className="min-w-0 break-words text-current">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {mobile ? (
        <div className="mt-auto space-y-4 border-t border-border pt-4">
          <div className="glass-panel-strong rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-soft">Session</p>
            <p className="mt-2 break-words text-sm font-medium text-app">{user?.fullName}</p>
            <p className="text-xs text-soft">{user?.roles[0]?.name ?? "Utilisateur"}</p>
          </div>

          <div className="glass-panel-strong space-y-2 rounded-2xl border border-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-soft">Apparence</p>
            <ThemeToggle
              className="w-full"
              buttonClassName="flex-1 justify-center"
              showLabels
              stretch
              onSelect={onAction}
            />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              onAction?.();
              void logout();
            }}
          >
            Déconnexion
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
