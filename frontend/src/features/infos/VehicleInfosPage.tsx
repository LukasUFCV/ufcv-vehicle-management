import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/api";

type VehicleInfo = {
  id: string;
  label: string;
  valueText?: string | null;
  visibility: string;
  infoType: { label: string };
};

export function VehicleInfosPage() {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [label, setLabel] = useState("");
  const [valueText, setValueText] = useState("");

  const vehiclesQuery = useQuery({
    queryKey: ["vehicle-infos-vehicles"],
    queryFn: () => api<PaginatedResponse<{ id: string; registrationNumber: string }>>("/vehicles?pageSize=100")
  });
  const infoTypesQuery = useQuery({
    queryKey: ["vehicle-info-types"],
    queryFn: () => api<{ data: Array<{ id: string; label: string }> }>("/infos/types?entityType=VEHICLE")
  });
  const infosQuery = useQuery({
    queryKey: ["vehicle-infos", selectedVehicleId],
    queryFn: () => api<{ data: VehicleInfo[] }>(`/infos/vehicles/${selectedVehicleId}`),
    enabled: Boolean(selectedVehicleId)
  });

  const [infoTypeId, setInfoTypeId] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api(`/infos/vehicles/${selectedVehicleId}`, {
        method: "POST",
        body: JSON.stringify({
          infoTypeId,
          label,
          valueText,
          visibility: "PRIVATE"
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-infos", selectedVehicleId] });
      setLabel("");
      setValueText("");
      setInfoTypeId("");
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Informations véhicules</h2>
            <p className="text-sm text-soft">Assurance, entretien, carte grise, documents internes.</p>
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
              { key: "type", header: "Type", cell: (item: VehicleInfo) => item.infoType.label },
              { key: "label", header: "Libellé", cell: (item: VehicleInfo) => item.label },
              { key: "value", header: "Valeur", cell: (item: VehicleInfo) => item.valueText ?? "Document lié" },
              { key: "visibility", header: "Visibilité", cell: (item: VehicleInfo) => item.visibility }
            ]}
            rows={infosQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Ajouter une information véhicule</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Select value={infoTypeId} onChange={(event) => setInfoTypeId(event.target.value)}>
            <option value="">Choisir un type</option>
            {infoTypesQuery.data?.data.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
          <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Libellé" />
          <Input value={valueText} onChange={(event) => setValueText(event.target.value)} placeholder="Référence ou commentaire" />
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedVehicleId || !infoTypeId || createMutation.isPending}
          >
            Ajouter
          </Button>
        </form>
      </Card>
    </section>
  );
}
