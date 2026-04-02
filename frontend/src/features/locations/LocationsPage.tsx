import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { api } from "../../lib/api";
import type { PaginatedResponse } from "../../types/api";

type LocationRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  parent?: { name: string } | null;
};

export function LocationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "SITE",
    parentId: ""
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => api<PaginatedResponse<LocationRecord>>("/locations?pageSize=100")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api("/locations", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          parentId: form.parentId || null
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setForm({ code: "", name: "", type: "SITE", parentId: "" });
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <Card>
        <h2 className="text-lg font-semibold">Localisations hiérarchiques</h2>
        <div className="mt-4">
          <DataTable
            getRowKey={(location) => location.id}
            mobileCard={(location) => (
              <Card className="space-y-4 p-4">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-app">{location.name}</p>
                  <p className="break-words text-sm text-soft">Code : {location.code}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-soft">Type</p>
                    <p className="mt-1 text-sm text-app">{location.type}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-soft">Parent</p>
                    <p className="mt-1 break-words text-sm text-app">
                      {location.parent?.name ?? "Racine"}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            columns={[
              { key: "code", header: "Code", cell: (location: LocationRecord) => location.code },
              { key: "name", header: "Nom", cell: (location: LocationRecord) => location.name },
              { key: "type", header: "Type", cell: (location: LocationRecord) => location.type },
              { key: "parent", header: "Parent", cell: (location: LocationRecord) => location.parent?.name ?? "Racine" }
            ]}
            rows={locationsQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Ajouter une localisation</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Code" />
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nom" />
          <Select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
            <option value="NATION">Nation</option>
            <option value="REGION">Région</option>
            <option value="AGGLOMERATION">Agglomération</option>
            <option value="SITE">Site</option>
          </Select>
          <Select value={form.parentId} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}>
            <option value="">Sans parent</option>
            {locationsQuery.data?.data.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Ajouter
          </Button>
        </form>
      </Card>
    </section>
  );
}
