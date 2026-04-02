import { OdometerEntryType, PermissionAction, PermissionModule } from "@prisma/client";
import { ensureVisibleVehicle } from "../../lib/access.js";
import type { AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";

export async function listVehicleOdometer(auth: AuthContext, vehicleId: string) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.ODOMETER, PermissionAction.VIEW);

  const [logs, tripLogs] = await Promise.all([
    prisma.vehicleOdometerLog.findMany({
      where: {
        vehicleId
      },
      include: {
        user: true,
        location: true,
        reservation: true
      },
      orderBy: {
        occurredAt: "desc"
      },
      take: 50
    }),
    prisma.tripLog.findMany({
      where: {
        vehicleId
      },
      include: {
        user: true,
        departureLocation: true,
        arrivalLocation: true,
        reservation: true
      },
      orderBy: {
        startedAt: "desc"
      },
      take: 20
    })
  ]);

  return {
    logs,
    tripLogs
  };
}

export async function createOdometerEntry(
  auth: AuthContext,
  vehicleId: string,
  input: {
    reservationId?: string | null;
    type: OdometerEntryType;
    valueKm: number;
    locationId?: string | null;
    note?: string | null;
    occurredAt: string;
  }
) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.ODOMETER, PermissionAction.CREATE);

  const log = await prisma.vehicleOdometerLog.create({
    data: {
      vehicleId,
      userId: auth.user.id,
      reservationId: input.reservationId ?? null,
      type: input.type,
      valueKm: input.valueKm,
      locationId: input.locationId ?? null,
      note: input.note ?? null,
      occurredAt: new Date(input.occurredAt)
    },
    include: {
      location: true,
      reservation: true
    }
  });

  if (input.reservationId) {
    if (input.type === OdometerEntryType.START) {
      await prisma.tripLog.upsert({
        where: { reservationId: input.reservationId },
        update: {
          departureKm: input.valueKm,
          departureLocationId: input.locationId ?? null,
          startedAt: new Date(input.occurredAt),
          comment: input.note ?? null
        },
        create: {
          reservationId: input.reservationId,
          vehicleId,
          userId: auth.user.id,
          departureKm: input.valueKm,
          departureLocationId: input.locationId ?? null,
          startedAt: new Date(input.occurredAt),
          comment: input.note ?? null
        }
      });
    }

    if (input.type === OdometerEntryType.END) {
      await prisma.tripLog.updateMany({
        where: {
          reservationId: input.reservationId
        },
        data: {
          arrivalKm: input.valueKm,
          arrivalLocationId: input.locationId ?? null,
          endedAt: new Date(input.occurredAt),
          comment: input.note ?? null
        }
      });
    }
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "ODOMETER",
    action: "CREATE",
    entityType: "vehicle_odometer_log",
    entityId: log.id
  });

  return log;
}
