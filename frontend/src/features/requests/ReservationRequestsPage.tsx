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

type RequestRecord = {
  id: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  status: string;
  requesterUser: { firstName: string; lastName: string };
  requestedFor: { firstName: string; lastName: string };
  vehicle?: { registrationNumber: string } | null;
};

export function ReservationRequestsPage() {
  const queryClient = useQueryClient();
  const [requestedForId, setRequestedForId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [destination, setDestination] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [arrivalAt, setArrivalAt] = useState("");

  const requestsQuery = useQuery({
    queryKey: ["reservation-requests"],
    queryFn: () => api<PaginatedResponse<RequestRecord>>("/reservation-requests?pageSize=20")
  });
  const usersQuery = useQuery({
    queryKey: ["users-for-request"],
    queryFn: () => api<PaginatedResponse<{ id: string; firstName: string; lastName: string }>>("/users?pageSize=100")
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-for-request"],
    queryFn: () => api<PaginatedResponse<{ id: string; registrationNumber: string }>>("/vehicles?pageSize=100")
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api("/reservation-requests", {
        method: "POST",
        body: JSON.stringify({
          requestedForId,
          vehicleId: vehicleId || null,
          departureAt: new Date(departureAt).toISOString(),
          arrivalAt: new Date(arrivalAt).toISOString(),
          destination
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation-requests"] });
      setRequestedForId("");
      setVehicleId("");
      setDestination("");
      setDepartureAt("");
      setArrivalAt("");
    }
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      requestId,
      decision
    }: {
      requestId: string;
      decision: "approve" | "reject";
    }) =>
      api(`/reservation-requests/${requestId}/${decision}`, {
        method: "PATCH",
        body: JSON.stringify({})
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation-requests"] });
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <Card>
        <h2 className="text-lg font-semibold">Demandes de réservation</h2>
        <p className="text-sm text-soft">Workflow brouillon, attente, validation et refus.</p>
        <div className="mt-4">
          <DataTable
            columns={[
              {
                key: "request",
                header: "Demande",
                cell: (request: RequestRecord) => (
                  <div>
                    <p className="font-medium">{request.destination}</p>
                    <p className="text-soft">
                      {request.requestedFor.firstName} {request.requestedFor.lastName}
                    </p>
                  </div>
                )
              },
              {
                key: "vehicle",
                header: "Véhicule",
                cell: (request: RequestRecord) => request.vehicle?.registrationNumber ?? "À attribuer"
              },
              {
                key: "dates",
                header: "Période",
                cell: (request: RequestRecord) => (
                  <div className="space-y-1">
                    <div>{formatDateTime(request.departureAt)}</div>
                    <div className="text-soft">{formatDateTime(request.arrivalAt)}</div>
                  </div>
                )
              },
              {
                key: "status",
                header: "Statut",
                cell: (request: RequestRecord) => (
                  <div className="space-y-2">
                    <Badge tone={request.status === "PENDING" ? "warning" : request.status === "CONVERTED" ? "success" : "neutral"}>
                      {request.status}
                    </Badge>
                    {request.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => reviewMutation.mutate({ requestId: request.id, decision: "approve" })}
                        >
                          Valider
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => reviewMutation.mutate({ requestId: request.id, decision: "reject" })}
                        >
                          Refuser
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )
              }
            ]}
            rows={requestsQuery.data?.data ?? []}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Créer une demande</h2>
        <p className="text-sm text-soft">Pour un besoin nécessitant validation avant conversion.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium">Demande pour</label>
            <Select value={requestedForId} onChange={(event) => setRequestedForId(event.target.value)}>
              <option value="">Choisir</option>
              {usersQuery.data?.data.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Véhicule souhaité</label>
            <Select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              <option value="">À définir</option>
              {vehiclesQuery.data?.data.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input type="datetime-local" value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} />
            <Input type="datetime-local" value={arrivalAt} onChange={(event) => setArrivalAt(event.target.value)} />
          </div>
          <Input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Destination"
          />
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Envoi..." : "Créer la demande"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
