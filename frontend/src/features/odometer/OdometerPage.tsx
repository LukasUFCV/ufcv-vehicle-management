import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import type { PaginatedResponse } from "../../types/api";

type OdometerResponse = {
  logs: Array<{
    id: string;
    valueKm: number;
    type: string;
    occurredAt: string;
    user: { firstName: string; lastName: string };
  }>;
};

export function OdometerPage() {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [type, setType] = useState("MANUAL");
  const [valueKm, setValueKm] = useState("");
  const [occurredAt, setOccurredAt] = useState("");

  const vehiclesQuery = useQuery({
    queryKey: ["odometer-vehicles"],
    queryFn: () => api<PaginatedResponse<{ id: string; registrationNumber: string }>>("/vehicles?pageSize=100")
  });
  const odometerQuery = useQuery({
    queryKey: ["odometer", selectedVehicleId],
    queryFn: () => api<OdometerResponse>(`/odometer/vehicles/${selectedVehicleId}`),
    enabled: Boolean(selectedVehicleId)
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api(`/odometer/vehicles/${selectedVehicleId}`, {
        method: "POST",
        body: JSON.stringify({
          type,
          valueKm: Number(valueKm),
          occurredAt: new Date(occurredAt).toISOString()
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["odometer", selectedVehicleId] });
      setValueKm("");
      setOccurredAt("");
      setType("MANUAL");
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Historique kilométrique</h2>
            <p className="text-sm text-soft">Saisie départ/arrivée et consultation des relevés.</p>
          </div>
          <Select value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)} className="max-w-sm">
            <option value="">Choisir un véhicule</option>
            {vehiclesQuery.data?.data.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registrationNumber}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4">
          <DataTable
            columns={[
              { key: "value", header: "Kilométrage", cell: (log: OdometerResponse["logs"][number]) => `${log.valueKm} km` },
              { key: "type", header: "Type", cell: (log: OdometerResponse["logs"][number]) => <Badge tone="info">{log.type}</Badge> },
              { key: "date", header: "Date", cell: (log: OdometerResponse["logs"][number]) => formatDateTime(log.occurredAt) },
              { key: "user", header: "Utilisateur", cell: (log: OdometerResponse["logs"][number]) => `${log.user.firstName} ${log.user.lastName}` }
            ]}
            rows={odometerQuery.data?.logs ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Saisir un relevé</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="MANUAL">Lecture manuelle</option>
            <option value="START">Départ</option>
            <option value="END">Arrivée</option>
          </Select>
          <Input type="number" value={valueKm} onChange={(event) => setValueKm(event.target.value)} placeholder="Kilométrage" />
          <Input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
          <Button type="submit" className="w-full" disabled={!selectedVehicleId || createMutation.isPending}>
            Enregistrer le relevé
          </Button>
        </form>
      </Card>
    </section>
  );
}
