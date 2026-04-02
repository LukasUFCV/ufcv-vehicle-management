import { promises as fs } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import type { Prisma } from "@prisma/client";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { ensureVisibleVehicle } from "../../lib/access.js";
import { buildPaginatedResponse, getPagination } from "../../lib/http.js";
import { buildVehicleVisibilityWhere, type AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { persistBuffer } from "../../lib/storage.js";
import { writeAuditLog } from "../../lib/audit.js";

type ListVehiclesInput = {
  search?: string;
  status?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
};

function vehicleSearchWhere(search?: string): Prisma.VehicleWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      { registrationNumber: { contains: search } },
      { internalName: { contains: search } },
      { type: { contains: search } },
      { notes: { contains: search } }
    ]
  };
}

export async function listVehicles(auth: AuthContext, input: ListVehiclesInput) {
  const { page, pageSize, skip } = getPagination(input);
  const where: Prisma.VehicleWhereInput = {
    deletedAt: null,
    AND: [
      buildVehicleVisibilityWhere(auth, PermissionModule.VEHICLES, PermissionAction.VIEW),
      input.status ? { status: input.status as never } : {},
      input.locationId
        ? {
            OR: [
              { currentLocationId: input.locationId },
              {
                locations: {
                  some: {
                    locationId: input.locationId,
                    releasedAt: null
                  }
                }
              }
            ]
          }
        : {},
      vehicleSearchWhere(input.search) ?? {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        currentLocation: true,
        reservations: {
          where: {
            deletedAt: null,
            arrivalAt: {
              gte: new Date()
            }
          },
          take: 1,
          orderBy: {
            departureAt: "asc"
          }
        }
      },
      orderBy: [{ status: "asc" }, { registrationNumber: "asc" }],
      skip,
      take: pageSize
    }),
    prisma.vehicle.count({ where })
  ]);

  return buildPaginatedResponse(
    items.map((vehicle) => ({
      id: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      internalName: vehicle.internalName,
      status: vehicle.status,
      availabilityLabel: vehicle.availabilityLabel,
      type: vehicle.type,
      isActive: vehicle.isActive,
      attachmentKey: vehicle.attachmentKey,
      currentLocation: vehicle.currentLocation,
      nextReservation: vehicle.reservations[0] ?? null
    })),
    total,
    page,
    pageSize
  );
}

export async function getVehicleDetails(auth: AuthContext, vehicleId: string) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.VEHICLES, PermissionAction.VIEW);

  return prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    include: {
      currentLocation: true,
      locations: {
        where: { releasedAt: null },
        include: {
          location: true
        }
      },
      images: true,
      infos: {
        where: { deletedAt: null },
        include: {
          infoType: true
        }
      },
      comments: {
        where: { deletedAt: null },
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      odometerLogs: {
        orderBy: {
          occurredAt: "desc"
        },
        take: 20,
        include: {
          user: true,
          location: true
        }
      },
      reservations: {
        where: {
          deletedAt: null,
          arrivalAt: {
            gte: new Date()
          }
        },
        include: {
          user: true,
          activity: true
        },
        orderBy: {
          departureAt: "asc"
        },
        take: 10
      }
    }
  });
}

export async function createVehicle(
  auth: AuthContext,
  input: {
    registrationNumber: string;
    internalName?: string | null;
    status: string;
    availabilityLabel: string;
    currentLocationId?: string | null;
    attachmentKey?: string | null;
    type: string;
    primaryImagePath?: string | null;
    notes?: string | null;
    inServiceAt?: string | null;
    isActive: boolean;
  }
) {
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: input.registrationNumber.toUpperCase(),
      internalName: input.internalName ?? null,
      status: input.status as never,
      availabilityLabel: input.availabilityLabel,
      currentLocationId: input.currentLocationId ?? null,
      attachmentKey: input.attachmentKey ?? null,
      type: input.type,
      primaryImagePath: input.primaryImagePath ?? null,
      notes: input.notes ?? null,
      inServiceAt: input.inServiceAt ? new Date(input.inServiceAt) : null,
      isActive: input.isActive
    }
  });

  if (input.currentLocationId) {
    await prisma.vehicleLocation.create({
      data: {
        vehicleId: vehicle.id,
        locationId: input.currentLocationId,
        isPrimary: true
      }
    });
  }

  await prisma.vehicleStatusHistory.create({
    data: {
      vehicleId: vehicle.id,
      changedById: auth.user.id,
      status: input.status as never,
      note: "Création du véhicule"
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "VEHICLES",
    action: "CREATE",
    entityType: "vehicle",
    entityId: vehicle.id
  });

  return getVehicleDetails(auth, vehicle.id);
}

export async function updateVehicle(
  auth: AuthContext,
  vehicleId: string,
  input: Partial<{
    registrationNumber: string;
    internalName?: string | null;
    status: string;
    availabilityLabel: string;
    currentLocationId?: string | null;
    attachmentKey?: string | null;
    type: string;
    primaryImagePath?: string | null;
    notes?: string | null;
    inServiceAt?: string | null;
    isActive: boolean;
  }>
) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.VEHICLES, PermissionAction.UPDATE);

  const currentVehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId }
  });

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      registrationNumber: input.registrationNumber?.toUpperCase(),
      internalName: input.internalName,
      status: input.status as never,
      availabilityLabel: input.availabilityLabel,
      currentLocationId: input.currentLocationId,
      attachmentKey: input.attachmentKey,
      type: input.type,
      primaryImagePath: input.primaryImagePath,
      notes: input.notes,
      inServiceAt: input.inServiceAt ? new Date(input.inServiceAt) : input.inServiceAt === null ? null : undefined,
      isActive: input.isActive
    }
  });

  if (
    Object.prototype.hasOwnProperty.call(input, "currentLocationId") &&
    input.currentLocationId &&
    input.currentLocationId !== currentVehicle.currentLocationId
  ) {
    await prisma.vehicleLocation.updateMany({
      where: {
        vehicleId,
        releasedAt: null
      },
      data: {
        releasedAt: new Date()
      }
    });

    await prisma.vehicleLocation.create({
      data: {
        vehicleId,
        locationId: input.currentLocationId,
        isPrimary: true
      }
    });
  }

  if (input.status && input.status !== currentVehicle.status) {
    await prisma.vehicleStatusHistory.create({
      data: {
        vehicleId,
        changedById: auth.user.id,
        status: input.status as never,
        note: "Changement de statut"
      }
    });
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "VEHICLES",
    action: "UPDATE",
    entityType: "vehicle",
    entityId: vehicleId
  });

  return getVehicleDetails(auth, vehicleId);
}

export async function deleteVehicle(auth: AuthContext, vehicleId: string) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.VEHICLES, PermissionAction.DELETE);

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      deletedAt: new Date(),
      isActive: false,
      status: "RETIRED"
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "VEHICLES",
    action: "DELETE",
    entityType: "vehicle",
    entityId: vehicleId
  });
}

async function createQrArtifact(vehicleId: string, deepLink: string) {
  const svg = await QRCode.toString(deepLink, {
    type: "svg",
    margin: 1,
    color: {
      dark: "#008DD1",
      light: "#FFFFFF"
    }
  });

  const persisted = await persistBuffer(
    env.QR_CODE_DIR,
    `vehicle-${vehicleId}.svg`,
    Buffer.from(svg)
  );

  const relativePath = path.relative(process.cwd(), persisted.absolutePath);

  await prisma.vehicleQrCode.create({
    data: {
      vehicleId,
      format: "svg",
      assetPath: relativePath,
      deepLink
    }
  });

  return {
    svg,
    assetPath: relativePath
  };
}

export async function getVehicleQrCode(auth: AuthContext, vehicleId: string) {
  const vehicle = await ensureVisibleVehicle(
    auth,
    vehicleId,
    PermissionModule.VEHICLES,
    PermissionAction.PRINT
  );

  const deepLink = `${env.APP_BASE_URL}/vehicules/scan/${vehicle.qrSlug}`;
  const latest = await prisma.vehicleQrCode.findFirst({
    where: { vehicleId },
    orderBy: {
      generatedAt: "desc"
    }
  });

  if (latest?.assetPath) {
    const absolutePath = path.resolve(process.cwd(), latest.assetPath);
    try {
      const svg = await fs.readFile(absolutePath, "utf8");
      return {
        svg,
        deepLink
      };
    } catch {
      return createQrArtifact(vehicleId, deepLink).then((artifact) => ({
        svg: artifact.svg,
        deepLink
      }));
    }
  }

  const artifact = await createQrArtifact(vehicleId, deepLink);
  return {
    svg: artifact.svg,
    deepLink
  };
}

export async function getVehicleBySlug(auth: AuthContext | null, qrSlug: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      qrSlug,
      deletedAt: null
    }
  });

  if (!vehicle) {
    return null;
  }

  if (auth) {
    await ensureVisibleVehicle(auth, vehicle.id, PermissionModule.VEHICLES, PermissionAction.VIEW);
  }

  return getVehicleDetails(
    auth ?? {
      sessionId: "public",
      sessionToken: "",
      user: {
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        status: "",
        roleKeys: [],
        locationIds: [],
        attachmentKeys: [],
        managedUserIds: []
      },
      permissions: {
        "VEHICLES:VIEW": ["ALL"]
      } as never
    },
    vehicle.id
  );
}
