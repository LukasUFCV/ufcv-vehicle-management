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
import { cn } from "../../lib/cn";

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

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  return (
    <aside className={cn("flex h-full flex-col gap-6", mobile ? "p-4" : "p-6")}>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <img
            src="/brand/ufcv-logo.png"
            alt="Logo UFCV"
            className="h-12 w-12 rounded-xl bg-black object-contain p-1"
          />
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
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-500 text-white shadow-soft"
                    : "text-soft hover:bg-surface hover:text-app"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
