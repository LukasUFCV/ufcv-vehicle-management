import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import type { PaginatedResponse } from "../../types/api";

type Reservation = {
  id: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  status: string;
  conflictCount: number;
  user: { id: string; firstName: string; lastName: string };
  vehicle: { id: string; registrationNumber: string };
};

type SimpleUser = { id: string; firstName: string; lastName: string };
type SimpleVehicle = { id: string; registrationNumber: string };
type Lookup = { id: string; code: string; label: string };

export function ReservationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [analyticsSearch, setAnalyticsSearch] = useState("");
  const [form, setForm] = useState({
    userId: "",
    vehicleId: "",
    activityId: "",
    analyticsCodeId: "",
    departureAt: "",
    arrivalAt: "",
    destination: "",
    notes: ""
  });

  const reservationsQuery = useQuery({
    queryKey: ["reservations", search],
    queryFn: () =>
      api<PaginatedResponse<Reservation>>(`/reservations?search=${encodeURIComponent(search)}&pageSize=20`)
  });

  const usersQuery = useQuery({
    queryKey: ["users-options"],
    queryFn: () => api<PaginatedResponse<SimpleUser>>("/users?pageSize=100")
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-options"],
    queryFn: () => api<PaginatedResponse<SimpleVehicle>>("/vehicles?pageSize=100")
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics-lookup", analyticsSearch],
    queryFn: () =>
      api<{ data: Lookup[] }>(`/reservations/lookup/analytics?search=${encodeURIComponent(analyticsSearch)}`),
    enabled: analyticsSearch.trim().length >= 3
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api<{ data: Reservation }>("/reservations", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          activityId: form.activityId || null,
          analyticsCodeId: form.analyticsCodeId || null,
          departureAt: new Date(form.departureAt).toISOString(),
          arrivalAt: new Date(form.arrivalAt).toISOString(),
          notes: form.notes || null
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setForm({
        userId: "",
        vehicleId: "",
        activityId: "",
        analyticsCodeId: "",
        departureAt: "",
        arrivalAt: "",
        destination: "",
        notes: ""
      });
      setAnalyticsSearch("");
    }
  });

  const rows = reservationsQuery.data?.data ?? [];
  const analyticsOptions = analyticsQuery.data?.data ?? [];
  const userOptions = usersQuery.data?.data ?? [];
  const vehicleOptions = vehiclesQuery.data?.data ?? [];

  const columns = useMemo(
    () => [
      {
        key: "reservation",
        header: "Réservation",
        cell: (reservation: Reservation) => (
          <div>
            <p className="font-medium">{reservation.destination}</p>
            <p className="text-soft">
              {reservation.user.firstName} {reservation.user.lastName}
            </p>
          </div>
        )
      },
      {
        key: "vehicle",
        header: "Véhicule",
        cell: (reservation: Reservation) => reservation.vehicle.registrationNumber
      },
      {
        key: "dates",
        header: "Période",
        cell: (reservation: Reservation) => (
          <div className="space-y-1">
            <div>{formatDateTime(reservation.departureAt)}</div>
            <div className="text-soft">{formatDateTime(reservation.arrivalAt)}</div>
          </div>
        )
      },
      {
        key: "status",
        header: "Statut",
        cell: (reservation: Reservation) => (
          <div className="space-y-2">
            <Badge
              tone={
                reservation.status === "CONFLICTED"
                  ? "danger"
                  : reservation.status === "CONFIRMED"
                    ? "success"
                    : "info"
              }
            >
              {reservation.status}
            </Badge>
            {reservation.conflictCount > 0 ? (
              <p className="text-xs text-red-600 dark:text-red-300">
                {reservation.conflictCount} conflit(s)
              </p>
            ) : null}
          </div>
        )
      }
    ],
    []
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Planning des réservations</h2>
            <p className="text-sm text-soft">Filtrez par destination, utilisateur ou véhicule.</p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une réservation"
            className="max-w-sm"
          />
        </div>

        <div className="mt-4">
          <DataTable columns={columns} rows={rows} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Nouvelle réservation</h2>
        <p className="text-sm text-soft">Création rapide avec détection automatique des conflits.</p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Utilisateur</label>
            <Select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>
              <option value="">Choisir</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Véhicule</label>
            <Select value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))}>
              <option value="">Choisir</option>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Analytique</label>
            <Input
              value={analyticsSearch}
              onChange={(event) => setAnalyticsSearch(event.target.value)}
              placeholder="Tapez 3 caractères"
            />
            {analyticsOptions.length ? (
              <div className="glass-floating mt-2 rounded-xl border border-border p-2">
                {analyticsOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-brand-500/10"
                    onClick={() => {
                      setForm((current) => ({ ...current, analyticsCodeId: option.id }));
                      setAnalyticsSearch(`${option.code} - ${option.label}`);
                    }}
                  >
                    {option.code} · {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Départ</label>
              <Input
                type="datetime-local"
                value={form.departureAt}
                onChange={(event) => setForm((current) => ({ ...current, departureAt: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Arrivée</label>
              <Input
                type="datetime-local"
                value={form.arrivalAt}
                onChange={(event) => setForm((current) => ({ ...current, arrivalAt: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Destination</label>
            <Input
              value={form.destination}
              onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))}
              placeholder="Destination ou objet"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Notes</label>
            <Input
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Informations complémentaires"
            />
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Création..." : "Créer la réservation"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
