import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

type DashboardResponse = {
  stats: {
    vehiclesVisible: number;
    reservationsToday: number;
    requestsPending: number;
    conflictsOpen: number;
  };
  myNextReservations: Array<{
    id: string;
    destination: string;
    departureAt: string;
    arrivalAt: string;
    vehicle: { registrationNumber: string; internalName?: string | null };
    activity?: { label: string } | null;
  }>;
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardResponse>("/dashboard/summary")
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Véhicules visibles"
          value={data?.stats.vehiclesVisible ?? (isLoading ? "..." : 0)}
          hint="Périmètre courant"
        />
        <StatCard
          title="Réservations du jour"
          value={data?.stats.reservationsToday ?? (isLoading ? "..." : 0)}
          hint="Départs et retours du jour"
        />
        <StatCard
          title="Demandes en attente"
          value={data?.stats.requestsPending ?? (isLoading ? "..." : 0)}
          hint="Demandes à traiter ou suivre"
        />
        <StatCard
          title="Conflits ouverts"
          value={data?.stats.conflictsOpen ?? (isLoading ? "..." : 0)}
          hint="Arbitrages à effectuer"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-lg font-semibold">Mes prochaines réservations</h2>
              <p className="text-sm text-soft">Vue rapide des trajets à venir.</p>
            </div>
            <Link to="/reservations" className="shrink-0 text-sm font-medium">
              Voir tout
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {data?.myNextReservations.length ? (
              data.myNextReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-xl border border-border bg-surface-strong p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-app">{reservation.destination}</p>
                      <p className="break-words text-sm text-soft">
                        {reservation.vehicle.registrationNumber}
                        {reservation.vehicle.internalName ? ` · ${reservation.vehicle.internalName}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-left text-sm text-soft sm:text-right">
                      <p>{formatDateTime(reservation.departureAt)}</p>
                      <p>{formatDateTime(reservation.arrivalAt)}</p>
                    </div>
                  </div>
                  {reservation.activity?.label ? (
                    <p className="mt-2 break-words text-sm text-soft">Activité : {reservation.activity.label}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-soft">Aucune réservation à venir.</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Accès rapides</h2>
          <p className="text-sm text-soft">Raccourcis vers les actions les plus fréquentes.</p>

          <div className="mt-4 grid gap-3">
            {[
              { to: "/reservations", label: "Créer une réservation" },
              { to: "/demandes", label: "Traiter les demandes" },
              { to: "/conflits", label: "Résoudre les conflits" },
              { to: "/vehicules", label: "Ouvrir le parc véhicule" },
              { to: "/informations-personnelles", label: "Mettre à jour mes informations" }
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-xl border border-border bg-surface-strong px-4 py-3 text-sm font-medium text-app transition hover:border-brand-300 hover:bg-brand-500/5"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
