import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import type { PaginatedResponse } from "../../types/api";

type CommentRecord = {
  id: string;
  body: string;
  visibility: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
};

export function CommentsPage() {
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [body, setBody] = useState("");

  const vehiclesQuery = useQuery({
    queryKey: ["comments-vehicles"],
    queryFn: () => api<PaginatedResponse<{ id: string; registrationNumber: string }>>("/vehicles?pageSize=100")
  });
  const commentsQuery = useQuery({
    queryKey: ["comments", selectedVehicleId],
    queryFn: () => api<{ data: CommentRecord[] }>(`/comments/vehicles/${selectedVehicleId}`),
    enabled: Boolean(selectedVehicleId)
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api(`/comments/vehicles/${selectedVehicleId}`, {
        method: "POST",
        body: JSON.stringify({
          body,
          visibility: "PUBLIC"
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", selectedVehicleId] });
      setBody("");
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Commentaires véhicule</h2>
            <p className="text-sm text-soft">Signalements, remarques d’usage et compléments terrain.</p>
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
              { key: "body", header: "Commentaire", cell: (item: CommentRecord) => item.body },
              {
                key: "author",
                header: "Auteur",
                cell: (item: CommentRecord) => `${item.author.firstName} ${item.author.lastName}`
              },
              {
                key: "date",
                header: "Date",
                cell: (item: CommentRecord) => formatDateTime(item.createdAt)
              }
            ]}
            rows={commentsQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Ajouter un commentaire</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Décrivez le point à signaler..." />
          <Button type="submit" className="w-full" disabled={!selectedVehicleId || createMutation.isPending}>
            Ajouter le commentaire
          </Button>
        </form>
      </Card>
    </section>
  );
}
