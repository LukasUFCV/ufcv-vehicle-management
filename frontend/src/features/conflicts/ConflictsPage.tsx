import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import type { PaginatedResponse } from "../../types/api";

type ConflictRecord = {
  id: string;
  reason: string;
  status: string;
  vehicle: { registrationNumber: string };
  reservation: { destination: string; departureAt: string; user: { firstName: string; lastName: string } };
  conflictingReservation: { destination: string; departureAt: string; user: { firstName: string; lastName: string } };
};

export function ConflictsPage() {
  const queryClient = useQueryClient();
  const conflictsQuery = useQuery({
    queryKey: ["conflicts"],
    queryFn: () => api<PaginatedResponse<ConflictRecord>>("/conflicts?pageSize=20")
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      conflictId,
      resolution
    }: {
      conflictId: string;
      resolution: "MARK_RESOLVED" | "CANCEL_PRIMARY" | "CANCEL_SECONDARY";
    }) =>
      api(`/conflicts/${conflictId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conflicts"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    }
  });

  return (
    <Card>
      <h2 className="text-lg font-semibold">Conflits ouverts</h2>
      <p className="text-sm text-soft">Analyse et résolution des chevauchements de réservation.</p>
      <div className="mt-4">
        <DataTable
          columns={[
            {
              key: "vehicle",
              header: "Véhicule",
              cell: (conflict: ConflictRecord) => conflict.vehicle.registrationNumber
            },
            {
              key: "primary",
              header: "Réservation A",
              cell: (conflict: ConflictRecord) => (
                <div>
                  <p className="font-medium">{conflict.reservation.destination}</p>
                  <p className="text-soft">
                    {conflict.reservation.user.firstName} {conflict.reservation.user.lastName}
                  </p>
                  <p className="text-soft">{formatDateTime(conflict.reservation.departureAt)}</p>
                </div>
              )
            },
            {
              key: "secondary",
              header: "Réservation B",
              cell: (conflict: ConflictRecord) => (
                <div>
                  <p className="font-medium">{conflict.conflictingReservation.destination}</p>
                  <p className="text-soft">
                    {conflict.conflictingReservation.user.firstName} {conflict.conflictingReservation.user.lastName}
                  </p>
                  <p className="text-soft">{formatDateTime(conflict.conflictingReservation.departureAt)}</p>
                </div>
              )
            },
            {
              key: "actions",
              header: "Traitement",
              cell: (conflict: ConflictRecord) => (
                <div className="space-y-2">
                  <Badge tone={conflict.status === "OPEN" ? "danger" : "success"}>{conflict.status}</Badge>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() =>
                        resolveMutation.mutate({ conflictId: conflict.id, resolution: "MARK_RESOLVED" })
                      }
                    >
                      Marquer résolu
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
                      onClick={() =>
                        resolveMutation.mutate({ conflictId: conflict.id, resolution: "CANCEL_PRIMARY" })
                      }
                    >
                      Annuler A
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
                      onClick={() =>
                        resolveMutation.mutate({ conflictId: conflict.id, resolution: "CANCEL_SECONDARY" })
                      }
                    >
                      Annuler B
                    </Button>
                  </div>
                </div>
              )
            }
          ]}
          rows={conflictsQuery.data?.data ?? []}
        />
      </div>
    </Card>
  );
}
