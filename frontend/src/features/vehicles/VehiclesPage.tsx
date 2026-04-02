import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/api";

type Vehicle = {
  id: string;
  registrationNumber: string;
  internalName?: string | null;
  status: string;
  availabilityLabel: string;
  type: string;
  currentLocation?: { name: string } | null;
  nextReservation?: { departureAt: string } | null;
};

export function VehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    registrationNumber: "",
    internalName: "",
    type: "",
    status: "AVAILABLE",
    currentLocationId: "",
    availabilityLabel: "Disponible"
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", search],
    queryFn: () => api<PaginatedResponse<Vehicle>>(`/vehicles?pageSize=20&search=${encodeURIComponent(search)}`)
  });
  const locationsQuery = useQuery({
    queryKey: ["locations-options"],
    queryFn: () => api<PaginatedResponse<{ id: string; name: string }>>("/locations?pageSize=100")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          internalName: form.internalName || null,
          currentLocationId: form.currentLocationId || null
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setForm({
        registrationNumber: "",
        internalName: "",
        type: "",
        status: "AVAILABLE",
        currentLocationId: "",
        availabilityLabel: "Disponible"
      });
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Parc véhicule</h2>
            <p className="text-sm text-soft">Disponibilité, emplacement, QR et accès détail.</p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un véhicule"
            className="max-w-sm"
          />
        </div>

        <div className="mt-4">
          <DataTable
            columns={[
              {
                key: "vehicle",
                header: "Véhicule",
                cell: (vehicle: Vehicle) => (
                  <div>
                    <Link to={`/vehicules/${vehicle.id}`} className="font-medium">
                      {vehicle.registrationNumber}
                    </Link>
                    <p className="text-soft">{vehicle.internalName || vehicle.type}</p>
                  </div>
                )
              },
              {
                key: "status",
                header: "Statut",
                cell: (vehicle: Vehicle) => (
                  <div className="space-y-2">
                    <Badge tone={vehicle.status === "AVAILABLE" ? "success" : vehicle.status === "MAINTENANCE" ? "warning" : "neutral"}>
                      {vehicle.status}
                    </Badge>
                    <p className="text-xs text-soft">{vehicle.availabilityLabel}</p>
                  </div>
                )
              },
              {
                key: "location",
                header: "Emplacement",
                cell: (vehicle: Vehicle) => vehicle.currentLocation?.name ?? "Non renseigné"
              }
            ]}
            rows={vehiclesQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Ajouter un véhicule</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input
            value={form.registrationNumber}
            onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))}
            placeholder="Immatriculation"
          />
          <Input
            value={form.internalName}
            onChange={(event) => setForm((current) => ({ ...current, internalName: event.target.value }))}
            placeholder="Nom interne"
          />
          <Input
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            placeholder="Type de véhicule"
          />
          <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
            <option value="AVAILABLE">Disponible</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Hors service</option>
          </Select>
          <Select
            value={form.currentLocationId}
            onChange={(event) => setForm((current) => ({ ...current, currentLocationId: event.target.value }))}
          >
            <option value="">Choisir un site</option>
            {locationsQuery.data?.data.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Création..." : "Ajouter le véhicule"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
