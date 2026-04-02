import createHttpError from "http-errors";
import type { Prisma } from "@prisma/client";
import { PermissionAction, PermissionModule, WorkflowStatus } from "@prisma/client";
import { buildPaginatedResponse, getPagination } from "../../lib/http.js";
import { buildUserVisibilityWhere, buildVehicleVisibilityWhere, type AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { createReservation } from "../reservations/reservations.service.js";

type ListReservationRequestsInput = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function requestSearchWhere(search?: string): Prisma.ReservationRequestWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      { destination: { contains: search } },
      { requesterUser: { firstName: { contains: search } } },
      { requesterUser: { lastName: { contains: search } } },
      { requestedFor: { firstName: { contains: search } } },
      { requestedFor: { lastName: { contains: search } } },
      { vehicle: { registrationNumber: { contains: search } } }
    ]
  };
}

export async function listReservationRequests(auth: AuthContext, input: ListReservationRequestsInput) {
  const { page, pageSize, skip } = getPagination(input);

  const where: Prisma.ReservationRequestWhereInput = {
    AND: [
      {
        OR: [
          { requesterUserId: auth.user.id },
          { requestedForId: auth.user.id },
          { requestedFor: buildUserVisibilityWhere(auth, PermissionModule.REQUESTS, PermissionAction.VIEW) },
          { vehicle: buildVehicleVisibilityWhere(auth, PermissionModule.REQUESTS, PermissionAction.VIEW) }
        ]
      },
      input.status ? { status: input.status as never } : {},
      requestSearchWhere(input.search) ?? {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.reservationRequest.findMany({
      where,
      include: {
        requesterUser: true,
        requestedFor: true,
        vehicle: true,
        activity: true,
        analyticsCode: true,
        convertedReservation: true
      },
      orderBy: {
        departureAt: "asc"
      },
      skip,
      take: pageSize
    }),
    prisma.reservationRequest.count({ where })
  ]);

  return buildPaginatedResponse(items, total, page, pageSize);
}

export async function createReservationRequest(
  auth: AuthContext,
  input: {
    requestedForId: string;
    vehicleId?: string | null;
    activityId?: string | null;
    analyticsCodeId?: string | null;
    departureAt: string;
    arrivalAt: string;
    destination: string;
    notes?: string | null;
  }
) {
  if (new Date(input.arrivalAt) <= new Date(input.departureAt)) {
    throw createHttpError(400, "La date d'arrivée doit être postérieure au départ.");
  }

  const request = await prisma.reservationRequest.create({
    data: {
      requesterUserId: auth.user.id,
      requestedForId: input.requestedForId,
      vehicleId: input.vehicleId ?? null,
      activityId: input.activityId ?? null,
      analyticsCodeId: input.analyticsCodeId ?? null,
      departureAt: new Date(input.departureAt),
      arrivalAt: new Date(input.arrivalAt),
      destination: input.destination,
      notes: input.notes ?? null,
      status: WorkflowStatus.PENDING
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: input.requestedForId,
    module: "REQUESTS",
    action: "CREATE",
    entityType: "reservation_request",
    entityId: request.id
  });

  return prisma.reservationRequest.findUniqueOrThrow({
    where: { id: request.id },
    include: {
      requesterUser: true,
      requestedFor: true,
      vehicle: true
    }
  });
}

export async function approveReservationRequest(
  auth: AuthContext,
  requestId: string,
  reviewComment?: string | null
) {
  const request = await prisma.reservationRequest.findUniqueOrThrow({
    where: { id: requestId }
  });

  if (request.status !== WorkflowStatus.PENDING) {
    throw createHttpError(400, "Seules les demandes en attente peuvent être traitées.");
  }

  if (!request.vehicleId) {
    throw createHttpError(400, "Une demande doit cibler un véhicule pour être convertie.");
  }

  const reservation = await createReservation(auth, {
    userId: request.requestedForId,
    vehicleId: request.vehicleId,
    activityId: request.activityId,
    analyticsCodeId: request.analyticsCodeId,
    departureAt: request.departureAt.toISOString(),
    arrivalAt: request.arrivalAt.toISOString(),
    destination: request.destination,
    notes: request.notes,
    sourceRequestId: request.id
  });

  await prisma.reservationRequest.update({
    where: { id: requestId },
    data: {
      status: WorkflowStatus.CONVERTED,
      approverId: auth.user.id,
      rejectionReason: reviewComment ?? null
    }
  });

  await prisma.notification.create({
    data: {
      userId: request.requestedForId,
      type: "SUCCESS",
      title: "Demande convertie",
      body: "Votre demande de réservation a été validée et convertie.",
      link: `/reservations`
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: request.requestedForId,
    module: "REQUESTS",
    action: "APPROVE",
    entityType: "reservation_request",
    entityId: requestId,
    details: {
      reservationId: reservation.id
    }
  });

  return reservation;
}

export async function rejectReservationRequest(
  auth: AuthContext,
  requestId: string,
  reviewComment?: string | null
) {
  const request = await prisma.reservationRequest.findUniqueOrThrow({
    where: { id: requestId }
  });

  await prisma.reservationRequest.update({
    where: { id: requestId },
    data: {
      status: WorkflowStatus.REJECTED,
      approverId: auth.user.id,
      rejectionReason: reviewComment ?? null
    }
  });

  await prisma.notification.create({
    data: {
      userId: request.requestedForId,
      type: "WARNING",
      title: "Demande refusée",
      body: reviewComment || "Votre demande de réservation a été refusée.",
      link: `/demandes`
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: request.requestedForId,
    module: "REQUESTS",
    action: "REJECT",
    entityType: "reservation_request",
    entityId: requestId
  });
}
