import { ConflictStatus, WorkflowStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  buildReservationVisibilityWhere,
  buildVehicleVisibilityWhere,
  type AuthContext
} from "../../lib/permissions.js";

export async function getDashboardSummary(auth: AuthContext) {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [vehiclesVisible, reservationsToday, requestsPending, conflictsOpen, myNextReservations] =
    await Promise.all([
      prisma.vehicle.count({
        where: {
          deletedAt: null,
          isActive: true,
          AND: [buildVehicleVisibilityWhere(auth, "VEHICLES" as never, "VIEW" as never)]
        }
      }),
      prisma.reservation.count({
        where: {
          deletedAt: null,
          AND: [
            buildReservationVisibilityWhere(auth),
            {
              departureAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          ]
        }
      }),
      prisma.reservationRequest.count({
        where: {
          status: WorkflowStatus.PENDING,
          OR: [{ requestedForId: auth.user.id }, { requesterUserId: auth.user.id }]
        }
      }),
      prisma.reservationConflict.count({
        where: {
          status: ConflictStatus.OPEN,
          reservation: {
            AND: [buildReservationVisibilityWhere(auth)]
          }
        }
      }),
      prisma.reservation.findMany({
        where: {
          userId: auth.user.id,
          deletedAt: null,
          arrivalAt: {
            gte: new Date()
          }
        },
        include: {
          vehicle: true,
          activity: true
        },
        orderBy: {
          departureAt: "asc"
        },
        take: 5
      })
    ]);

  return {
    stats: {
      vehiclesVisible,
      reservationsToday,
      requestsPending,
      conflictsOpen
    },
    myNextReservations
  };
}
