import createHttpError from "http-errors";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { prisma } from "./prisma.js";
import {
  buildReservationVisibilityWhere,
  buildUserVisibilityWhere,
  buildVehicleVisibilityWhere,
  type AuthContext
} from "./permissions.js";

export async function ensureVisibleUser(
  auth: AuthContext,
  userId: string,
  module: PermissionModule,
  action: PermissionAction
) {
  const user = await prisma.user.findFirst({
    where: {
      AND: [{ id: userId, deletedAt: null }, buildUserVisibilityWhere(auth, module, action)]
    },
    include: {
      locations: {
        where: { endsAt: null },
        include: {
          location: true
        }
      },
      roleAssignments: {
        where: { isActive: true },
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    throw createHttpError(404, "Utilisateur introuvable dans votre périmètre.");
  }

  return user;
}

export async function ensureVisibleVehicle(
  auth: AuthContext,
  vehicleId: string,
  module: PermissionModule,
  action: PermissionAction
) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      AND: [{ id: vehicleId, deletedAt: null }, buildVehicleVisibilityWhere(auth, module, action)]
    },
    include: {
      currentLocation: true,
      locations: {
        where: { releasedAt: null },
        include: {
          location: true
        }
      }
    }
  });

  if (!vehicle) {
    throw createHttpError(404, "Véhicule introuvable dans votre périmètre.");
  }

  return vehicle;
}

export async function ensureVisibleReservation(auth: AuthContext, reservationId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: {
      AND: [{ id: reservationId, deletedAt: null }, buildReservationVisibilityWhere(auth)]
    },
    include: {
      user: true,
      vehicle: true,
      activity: true,
      analyticsCode: true
    }
  });

  if (!reservation) {
    throw createHttpError(404, "Réservation introuvable.");
  }

  return reservation;
}
