import type { Prisma } from "@prisma/client";
import { ConflictStatus, ReservationStatus } from "@prisma/client";
import { buildPaginatedResponse, getPagination } from "../../lib/http.js";
import { buildReservationVisibilityWhere, type AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";

type ListConflictsInput = {
  search?: string;
  status?: string;
  vehicleId?: string;
  page?: number;
  pageSize?: number;
};

function conflictSearchWhere(search?: string): Prisma.ReservationConflictWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      { reason: { contains: search } },
      { vehicle: { registrationNumber: { contains: search } } },
      { reservation: { destination: { contains: search } } },
      { conflictingReservation: { destination: { contains: search } } }
    ]
  };
}

export async function listConflicts(auth: AuthContext, input: ListConflictsInput) {
  const { page, pageSize, skip } = getPagination(input);
  const where: Prisma.ReservationConflictWhereInput = {
    AND: [
      {
        OR: [
          { reservation: buildReservationVisibilityWhere(auth) },
          { conflictingReservation: buildReservationVisibilityWhere(auth) }
        ]
      },
      input.status ? { status: input.status as never } : {},
      input.vehicleId ? { vehicleId: input.vehicleId } : {},
      conflictSearchWhere(input.search) ?? {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.reservationConflict.findMany({
      where,
      include: {
        vehicle: true,
        reservation: {
          include: {
            user: true
          }
        },
        conflictingReservation: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: pageSize
    }),
    prisma.reservationConflict.count({ where })
  ]);

  return buildPaginatedResponse(items, total, page, pageSize);
}

export async function resolveConflict(
  auth: AuthContext,
  conflictId: string,
  input: {
    resolution: "MARK_RESOLVED" | "CANCEL_PRIMARY" | "CANCEL_SECONDARY";
    notes?: string | null;
  }
) {
  const conflict = await prisma.reservationConflict.findUniqueOrThrow({
    where: { id: conflictId }
  });

  if (input.resolution === "CANCEL_PRIMARY") {
    await prisma.reservation.update({
      where: { id: conflict.reservationId },
      data: {
        status: ReservationStatus.CANCELLED,
        deletedAt: new Date()
      }
    });
  }

  if (input.resolution === "CANCEL_SECONDARY") {
    await prisma.reservation.update({
      where: { id: conflict.conflictingReservationId },
      data: {
        status: ReservationStatus.CANCELLED,
        deletedAt: new Date()
      }
    });
  }

  await prisma.reservationConflict.update({
    where: { id: conflictId },
    data: {
      status: ConflictStatus.RESOLVED,
      notes: input.notes ?? null,
      resolvedAt: new Date(),
      resolvedById: auth.user.id
    }
  });

  await prisma.reservation.updateMany({
    where: {
      id: {
        in: [conflict.reservationId, conflict.conflictingReservationId]
      },
      deletedAt: null
    },
    data: {
      status: ReservationStatus.CONFIRMED
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "CONFLICTS",
    action: "RESOLVE",
    entityType: "reservation_conflict",
    entityId: conflictId,
    details: input
  });
}
