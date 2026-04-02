import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/format";

type VehicleDetail = {
  data: {
    registrationNumber: string;
    internalName?: string | null;
    status: string;
    currentLocation?: { name: string } | null;
    odometerLogs: Array<{ id: string; valueKm: number; occurredAt: string }>;
  };
};

export function ScanVehiclePage() {
  const { slug = "" } = useParams();
  const vehicleQuery = useQuery({
    queryKey: ["vehicle-scan", slug],
    queryFn: () => api<VehicleDetail>(`/vehicles/scan/${slug}`)
  });

  const vehicle = vehicleQuery.data?.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <p className="text-sm uppercase tracking-[0.24em] text-soft">Accès par QR code</p>
        <h1 className="mt-2 text-3xl font-semibold text-app">
          {vehicle?.registrationNumber} {vehicle?.internalName ? `· ${vehicle.internalName}` : ""}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {vehicle ? <Badge tone="info">{vehicle.status}</Badge> : null}
          <span className="text-sm text-soft">{vehicle?.currentLocation?.name ?? "Site non renseigné"}</span>
        </div>
        <div className="mt-6 space-y-3">
          {vehicle?.odometerLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="rounded-xl border border-border bg-surface-strong p-3">
              <p className="font-medium">{log.valueKm} km</p>
              <p className="text-sm text-soft">{formatDateTime(log.occurredAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
