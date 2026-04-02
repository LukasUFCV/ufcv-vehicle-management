import { PermissionAction, PermissionModule, WorkflowStatus, type Prisma } from "@prisma/client";
import { ensureVisibleUser, ensureVisibleVehicle } from "../../lib/access.js";
import type { AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";

export async function listUserInfos(auth: AuthContext, userId: string) {
  await ensureVisibleUser(auth, userId, PermissionModule.USER_INFOS, PermissionAction.VIEW);

  return prisma.userInfo.findMany({
    where: {
      userId,
      deletedAt: null
    },
    include: {
      infoType: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createUserInfo(
  auth: AuthContext,
  userId: string,
  input: {
    infoTypeId: string;
    label: string;
    valueText?: string | null;
    visibility: "PUBLIC" | "PRIVATE";
    validFrom?: string | null;
    validTo?: string | null;
  }
) {
  await ensureVisibleUser(auth, userId, PermissionModule.USER_INFOS, PermissionAction.CREATE);

  const info = await prisma.userInfo.create({
    data: {
      userId,
      infoTypeId: input.infoTypeId,
      label: input.label,
      valueText: input.valueText ?? null,
      visibility: input.visibility,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validTo: input.validTo ? new Date(input.validTo) : null,
      createdById: auth.user.id
    },
    include: {
      infoType: true
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: userId,
    module: "USER_INFOS",
    action: "CREATE",
    entityType: "user_info",
    entityId: info.id
  });

  return info;
}

export async function deleteUserInfo(auth: AuthContext, infoId: string) {
  const info = await prisma.userInfo.findUniqueOrThrow({
    where: { id: infoId }
  });

  await ensureVisibleUser(auth, info.userId, PermissionModule.USER_INFOS, PermissionAction.DELETE);
  await prisma.userInfo.update({
    where: { id: infoId },
    data: {
      deletedAt: new Date(),
      status: WorkflowStatus.ARCHIVED
    }
  });
}

export async function createUserInfoRequest(
  auth: AuthContext,
  userId: string,
  input: {
    infoTypeId: string;
    changeType: "CREATE" | "UPDATE" | "DELETE";
    payload: Record<string, unknown>;
  }
) {
  await ensureVisibleUser(auth, userId, PermissionModule.USER_INFOS, PermissionAction.CREATE);

  return prisma.userInfoRequest.create({
    data: {
      userId,
      infoTypeId: input.infoTypeId,
      changeType: input.changeType,
      payload: input.payload as Prisma.InputJsonValue,
      requestedById: auth.user.id
    }
  });
}

export async function listVehicleInfos(auth: AuthContext, vehicleId: string) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.VEHICLE_INFOS, PermissionAction.VIEW);

  return prisma.vehicleInfo.findMany({
    where: {
      vehicleId,
      deletedAt: null
    },
    include: {
      infoType: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createVehicleInfo(
  auth: AuthContext,
  vehicleId: string,
  input: {
    infoTypeId: string;
    label: string;
    valueText?: string | null;
    visibility: "PUBLIC" | "PRIVATE";
    validFrom?: string | null;
    validTo?: string | null;
  }
) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.VEHICLE_INFOS, PermissionAction.CREATE);

  const info = await prisma.vehicleInfo.create({
    data: {
      vehicleId,
      infoTypeId: input.infoTypeId,
      label: input.label,
      valueText: input.valueText ?? null,
      visibility: input.visibility,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validTo: input.validTo ? new Date(input.validTo) : null,
      createdById: auth.user.id
    },
    include: {
      infoType: true
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "VEHICLE_INFOS",
    action: "CREATE",
    entityType: "vehicle_info",
    entityId: info.id
  });

  return info;
}

export async function deleteVehicleInfo(auth: AuthContext, infoId: string) {
  const info = await prisma.vehicleInfo.findUniqueOrThrow({
    where: { id: infoId }
  });

  await ensureVisibleVehicle(auth, info.vehicleId, PermissionModule.VEHICLE_INFOS, PermissionAction.DELETE);
  await prisma.vehicleInfo.update({
    where: { id: infoId },
    data: {
      deletedAt: new Date(),
      status: WorkflowStatus.ARCHIVED
    }
  });
}

export async function createVehicleInfoRequest(
  auth: AuthContext,
  vehicleId: string,
  input: {
    infoTypeId: string;
    changeType: "CREATE" | "UPDATE" | "DELETE";
    payload: Record<string, unknown>;
  }
) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.VEHICLE_INFOS, PermissionAction.CREATE);

  return prisma.vehicleInfoRequest.create({
    data: {
      vehicleId,
      infoTypeId: input.infoTypeId,
      changeType: input.changeType,
      payload: input.payload as Prisma.InputJsonValue,
      requestedById: auth.user.id
    }
  });
}

export async function listInfoRequests(auth: AuthContext) {
  const [userRequests, vehicleRequests] = await Promise.all([
    prisma.userInfoRequest.findMany({
      where: {
        status: WorkflowStatus.PENDING,
        user: {
          id: {
            not: ""
          }
        }
      },
      include: {
        user: true,
        infoType: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.vehicleInfoRequest.findMany({
      where: {
        status: WorkflowStatus.PENDING
      },
      include: {
        vehicle: true,
        infoType: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  return {
    userRequests,
    vehicleRequests
  };
}

export async function listInfoTypes(entityType: "USER" | "VEHICLE") {
  return prisma.infoType.findMany({
    where: {
      entityType
    },
    orderBy: {
      label: "asc"
    }
  });
}

export async function reviewUserInfoRequest(
  auth: AuthContext,
  requestId: string,
  input: { approve: boolean; reviewComment?: string | null }
) {
  const request = await prisma.userInfoRequest.findUniqueOrThrow({
    where: { id: requestId }
  });

  await prisma.userInfoRequest.update({
    where: { id: requestId },
    data: {
      status: input.approve ? WorkflowStatus.APPROVED : WorkflowStatus.REJECTED,
      reviewedById: auth.user.id,
      reviewComment: input.reviewComment ?? null
    }
  });

  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: input.approve ? "SUCCESS" : "WARNING",
      title: input.approve ? "Demande d'information validée" : "Demande d'information refusée",
      body: input.reviewComment || "Le statut de votre demande d'information a changé."
    }
  });
}

export async function reviewVehicleInfoRequest(
  auth: AuthContext,
  requestId: string,
  input: { approve: boolean; reviewComment?: string | null }
) {
  await prisma.vehicleInfoRequest.update({
    where: { id: requestId },
    data: {
      status: input.approve ? WorkflowStatus.APPROVED : WorkflowStatus.REJECTED,
      reviewedById: auth.user.id,
      reviewComment: input.reviewComment ?? null
    }
  });
}
