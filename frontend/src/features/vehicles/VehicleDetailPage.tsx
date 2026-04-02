import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

type VehicleDetail = {
  id: string;
  registrationNumber: string;
  internalName?: string | null;
  status: string;
  availabilityLabel: string;
  type: string;
  notes?: string | null;
  currentLocation?: { name: string } | null;
  reservations: Array<{
    id: string;
    destination: string;
    departureAt: string;
    user: { firstName: string; lastName: string };
  }>;
  odometerLogs: Array<{
    id: string;
    type: string;
    valueKm: number;
    occurredAt: string;
    user: { firstName: string; lastName: string };
  }>;
};

export function VehicleDetailPage() {
  const { vehicleId = "" } = useParams();
  const queryClient = useQueryClient();
  const [odometer, setOdometer] = useState({
    type: "MANUAL",
    valueKm: "",
    occurredAt: "",
    note: ""
  });

  const vehicleQuery = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => api<{ data: VehicleDetail }>(`/vehicles/${vehicleId}`)
  });
  const qrQuery = useQuery({
    queryKey: ["vehicle-qrcode", vehicleId],
    queryFn: () => api<{ svg: string; deepLink: string }>(`/vehicles/${vehicleId}/qrcode`)
  });

  const odometerMutation = useMutation({
    mutationFn: () =>
      api(`/odometer/vehicles/${vehicleId}`, {
        method: "POST",
        body: JSON.stringify({
          type: odometer.type,
          valueKm: Number(odometer.valueKm),
          occurredAt: new Date(odometer.occurredAt).toISOString(),
          note: odometer.note || null
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      setOdometer({
        type: "MANUAL",
        valueKm: "",
        occurredAt: "",
        note: ""
      });
    }
  });

  const vehicle = vehicleQuery.data?.data;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-soft">Fiche véhicule</p>
              <h2 className="mt-2 text-2xl font-semibold text-app">
                {vehicle?.registrationNumber} {vehicle?.internalName ? `· ${vehicle.internalName}` : ""}
              </h2>
              <p className="mt-2 text-sm text-soft">{vehicle?.type}</p>
            </div>
            {vehicle ? (
              <Badge tone={vehicle.status === "AVAILABLE" ? "success" : vehicle.status === "MAINTENANCE" ? "warning" : "neutral"}>
                {vehicle.status}
              </Badge>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-strong p-4">
              <p className="text-sm text-soft">Emplacement</p>
              <p className="mt-1 font-medium">{vehicle?.currentLocation?.name ?? "Non renseigné"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-strong p-4">
              <p className="text-sm text-soft">Disponibilité</p>
              <p className="mt-1 font-medium">{vehicle?.availabilityLabel ?? "Non renseigné"}</p>
            </div>
          </div>
          {vehicle?.notes ? <p className="mt-4 text-sm text-soft">{vehicle.notes}</p> : null}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Réservations à venir</h3>
          <div className="mt-4">
            <DataTable
              columns={[
                {
                  key: "destination",
                  header: "Destination",
                  cell: (reservation: VehicleDetail["reservations"][number]) => reservation.destination
                },
                {
                  key: "user",
                  header: "Utilisateur",
                  cell: (reservation: VehicleDetail["reservations"][number]) =>
                    `${reservation.user.firstName} ${reservation.user.lastName}`
                },
                {
                  key: "departure",
                  header: "Départ",
                  cell: (reservation: VehicleDetail["reservations"][number]) =>
                    formatDateTime(reservation.departureAt)
                }
              ]}
              rows={vehicle?.reservations ?? []}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">QR code</h3>
              <p className="text-sm text-soft">Scan vers la fiche véhicule ou impression terrain.</p>
            </div>
            <Button variant="secondary" onClick={() => window.print()}>
              Imprimer
            </Button>
          </div>
          {qrQuery.data ? (
            <div
              className="mt-4 rounded-2xl border border-border bg-white p-4"
              dangerouslySetInnerHTML={{ __html: qrQuery.data.svg }}
            />
          ) : null}
          <p className="mt-3 break-all text-xs text-soft">{qrQuery.data?.deepLink}</p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Saisie kilométrage</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              odometerMutation.mutate();
            }}
          >
            <Select value={odometer.type} onChange={(event) => setOdometer((current) => ({ ...current, type: event.target.value }))}>
              <option value="MANUAL">Lecture manuelle</option>
              <option value="START">Départ</option>
              <option value="END">Arrivée</option>
            </Select>
            <Input
              type="number"
              value={odometer.valueKm}
              onChange={(event) => setOdometer((current) => ({ ...current, valueKm: event.target.value }))}
              placeholder="Kilométrage"
            />
            <Input
              type="datetime-local"
              value={odometer.occurredAt}
              onChange={(event) => setOdometer((current) => ({ ...current, occurredAt: event.target.value }))}
            />
            <Input
              value={odometer.note}
              onChange={(event) => setOdometer((current) => ({ ...current, note: event.target.value }))}
              placeholder="Commentaire"
            />
            <Button type="submit" className="w-full" disabled={odometerMutation.isPending}>
              Enregistrer
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            {vehicle?.odometerLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-border bg-surface-strong p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.valueKm} km</span>
                  <Badge tone="info">{log.type}</Badge>
                </div>
                <p className="mt-1 text-soft">
                  {formatDateTime(log.occurredAt)} · {log.user.firstName} {log.user.lastName}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
