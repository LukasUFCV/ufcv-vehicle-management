import createHttpError from "http-errors";
import type { Prisma } from "@prisma/client";
import {
  ConflictStatus,
  PermissionAction,
  PermissionModule,
  ReservationStatus
} from "@prisma/client";
import { ensureVisibleUser, ensureVisibleVehicle } from "../../lib/access.js";
import { writeAuditLog } from "../../lib/audit.js";
import { buildPaginatedResponse, getPagination } from "../../lib/http.js";
import { buildReservationVisibilityWhere, type AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";

type ListReservationsInput = {
  search?: string;
  userId?: string;
  vehicleId?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

function reservationSearchWhere(search?: string): Prisma.ReservationWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      { destination: { contains: search } },
      { notes: { contains: search } },
      { user: { firstName: { contains: search } } },
      { user: { lastName: { contains: search } } },
      { vehicle: { registrationNumber: { contains: search } } }
    ]
  };
}

async function findOverlaps(
  vehicleId: string,
  departureAt: Date,
  arrivalAt: Date,
  excludeReservationId?: string
) {
  return prisma.reservation.findMany({
    where: {
      vehicleId,
      deletedAt: null,
      status: {
        notIn: [ReservationStatus.CANCELLED]
      },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      departureAt: {
        lt: arrivalAt
      },
      arrivalAt: {
        gt: departureAt
      }
    }
  });
}

async function reconcileReservationStatuses(reservationIds: string[]) {
  const uniqueIds = [...new Set(reservationIds)];

  for (const reservationId of uniqueIds) {
    const openConflicts = await prisma.reservationConflict.count({
      where: {
        status: ConflictStatus.OPEN,
        OR: [{ reservationId }, { conflictingReservationId: reservationId }]
      }
    });

    const current = await prisma.reservation.findUnique({
      where: { id: reservationId }
    });

    if (!current || current.deletedAt || current.status === ReservationStatus.CANCELLED) {
      continue;
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: openConflicts > 0 ? ReservationStatus.CONFLICTED : ReservationStatus.CONFIRMED
      }
    });
  }
}

async function syncReservationConflicts(reservationId: string) {
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId }
  });

  await prisma.reservationConflict.deleteMany({
    where: {
      OR: [{ reservationId }, { conflictingReservationId: reservationId }]
    }
  });

  const overlaps = await findOverlaps(
    reservation.vehicleId,
    reservation.departureAt,
    reservation.arrivalAt,
    reservation.id
  );

  if (overlaps.length > 0) {
    await prisma.reservationConflict.createMany({
      data: overlaps.map((otherReservation) => {
        const [firstId, secondId] = [reservation.id, otherReservation.id].sort();

        return {
          reservationId: firstId,
          conflictingReservationId: secondId,
          vehicleId: reservation.vehicleId,
          reason: "Chevauchement de réservation détecté automatiquement."
        };
      }),
      skipDuplicates: true
    });
  }

  await reconcileReservationStatuses([reservation.id, ...overlaps.map((item) => item.id)]);

  return overlaps;
}

async function writeReservationHistory(
  reservationId: string,
  action: string,
  actorUserId: string,
  snapshot?: Record<string, unknown>
) {
  await prisma.reservationHistory.create({
    data: {
      reservationId,
      action,
      actorUserId,
      snapshot: snapshot as Prisma.InputJsonValue | undefined
    }
  });
}

export async function listReservations(auth: AuthContext, input: ListReservationsInput) {
  const { page, pageSize, skip } = getPagination(input);
  const where: Prisma.ReservationWhereInput = {
    deletedAt: null,
    AND: [
      buildReservationVisibilityWhere(auth),
      input.userId ? { userId: input.userId } : {},
      input.vehicleId ? { vehicleId: input.vehicleId } : {},
      input.status ? { status: input.status as never } : {},
      input.from ? { departureAt: { gte: new Date(input.from) } } : {},
      input.to ? { arrivalAt: { lte: new Date(input.to) } } : {},
      reservationSearchWhere(input.search) ?? {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        user: true,
        vehicle: true,
        activity: true,
        analyticsCode: true,
        primaryConflicts: {
          where: { status: ConflictStatus.OPEN }
        },
        secondaryConflicts: {
          where: { status: ConflictStatus.OPEN }
        }
      },
      orderBy: {
        departureAt: "asc"
      },
      skip,
      take: pageSize
    }),
    prisma.reservation.count({ where })
  ]);

  return buildPaginatedResponse(
    items.map((reservation) => ({
      ...reservation,
      conflictCount:
        reservation.primaryConflicts.length + reservation.secondaryConflicts.length
    })),
    total,
    page,
    pageSize
  );
}

export async function createReservation(
  auth: AuthContext,
  input: {
    userId: string;
    vehicleId: string;
    activityId?: string | null;
    analyticsCodeId?: string | null;
    departureAt: string;
    arrivalAt: string;
    departureLocationId?: string | null;
    arrivalLocationId?: string | null;
    destination: string;
    notes?: string | null;
    sourceRequestId?: string | null;
  }
) {
  const departureAt = new Date(input.departureAt);
  const arrivalAt = new Date(input.arrivalAt);

  if (arrivalAt <= departureAt) {
    throw createHttpError(400, "La date d'arrivée doit être postérieure au départ.");
  }

  await ensureVisibleUser(auth, input.userId, PermissionModule.USERS, PermissionAction.VIEW);
  await ensureVisibleVehicle(auth, input.vehicleId, PermissionModule.VEHICLES, PermissionAction.VIEW);

  const reservation = await prisma.reservation.create({
    data: {
      userId: input.userId,
      vehicleId: input.vehicleId,
      activityId: input.activityId ?? null,
      analyticsCodeId: input.analyticsCodeId ?? null,
      departureAt,
      arrivalAt,
      departureLocationId: input.departureLocationId ?? null,
      arrivalLocationId: input.arrivalLocationId ?? null,
      destination: input.destination,
      status: ReservationStatus.PENDING,
      createdById: auth.user.id,
      notes: input.notes ?? null,
      sourceRequestId: input.sourceRequestId ?? null
    }
  });

  const overlaps = await syncReservationConflicts(reservation.id);

  await writeReservationHistory(reservation.id, "CREATE", auth.user.id, {
    overlaps: overlaps.map((overlap) => overlap.id)
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: input.userId,
    module: "RESERVATIONS",
    action: "CREATE",
    entityType: "reservation",
    entityId: reservation.id
  });

  return prisma.reservation.findUniqueOrThrow({
    where: { id: reservation.id },
    include: {
      user: true,
      vehicle: true,
      activity: true,
      analyticsCode: true
    }
  });
}

export async function updateReservation(
  auth: AuthContext,
  reservationId: string,
  input: Partial<{
    userId: string;
    vehicleId: string;
    activityId?: string | null;
    analyticsCodeId?: string | null;
    departureAt: string;
    arrivalAt: string;
    departureLocationId?: string | null;
    arrivalLocationId?: string | null;
    destination: string;
    notes?: string | null;
    status: ReservationStatus;
  }>
) {
  await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId }
  });

  if (input.userId) {
    await ensureVisibleUser(auth, input.userId, PermissionModule.USERS, PermissionAction.VIEW);
  }

  if (input.vehicleId) {
    await ensureVisibleVehicle(auth, input.vehicleId, PermissionModule.VEHICLES, PermissionAction.VIEW);
  }

  if (input.departureAt && input.arrivalAt) {
    if (new Date(input.arrivalAt) <= new Date(input.departureAt)) {
      throw createHttpError(400, "La date d'arrivée doit être postérieure au départ.");
    }
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      userId: input.userId,
      vehicleId: input.vehicleId,
      activityId: input.activityId,
      analyticsCodeId: input.analyticsCodeId,
      departureAt: input.departureAt ? new Date(input.departureAt) : undefined,
      arrivalAt: input.arrivalAt ? new Date(input.arrivalAt) : undefined,
      departureLocationId: input.departureLocationId,
      arrivalLocationId: input.arrivalLocationId,
      destination: input.destination,
      notes: input.notes,
      status: input.status,
      updatedById: auth.user.id
    }
  });

  const overlaps = await syncReservationConflicts(reservationId);

  await writeReservationHistory(reservationId, "UPDATE", auth.user.id, {
    overlaps: overlaps.map((overlap) => overlap.id)
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "RESERVATIONS",
    action: "UPDATE",
    entityType: "reservation",
    entityId: reservationId
  });

  return prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    include: {
      user: true,
      vehicle: true,
      activity: true,
      analyticsCode: true
    }
  });
}

export async function deleteReservation(auth: AuthContext, reservationId: string) {
  const reservation = await prisma.reservation.findUniqueOrThrow({
    where: { id: reservationId }
  });

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      deletedAt: new Date(),
      status: ReservationStatus.CANCELLED,
      updatedById: auth.user.id
    }
  });

  await prisma.reservationConflict.updateMany({
    where: {
      OR: [{ reservationId }, { conflictingReservationId: reservationId }]
    },
    data: {
      status: ConflictStatus.CANCELLED,
      resolvedAt: new Date(),
      resolvedById: auth.user.id
    }
  });

  await reconcileReservationStatuses([reservationId]);

  await writeReservationHistory(reservationId, "DELETE", auth.user.id);
  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: reservation.userId,
    module: "RESERVATIONS",
    action: "DELETE",
    entityType: "reservation",
    entityId: reservationId
  });
}

export async function analyticsAutocomplete(search?: string) {
  if (!search || search.trim().length < 3) {
    return [];
  }

  return prisma.analyticsCode.findMany({
    where: {
      isActive: true,
      OR: [{ code: { contains: search } }, { label: { contains: search } }]
    },
    orderBy: {
      code: "asc"
    },
    take: 10
  });
}
