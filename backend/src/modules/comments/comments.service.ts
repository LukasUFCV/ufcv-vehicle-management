import { PermissionAction, PermissionModule, WorkflowStatus } from "@prisma/client";
import { ensureVisibleVehicle } from "../../lib/access.js";
import type { AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";

export async function listVehicleComments(auth: AuthContext, vehicleId: string) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.COMMENTS, PermissionAction.VIEW);

  return prisma.vehicleComment.findMany({
    where: {
      vehicleId,
      deletedAt: null
    },
    include: {
      author: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function createVehicleComment(
  auth: AuthContext,
  vehicleId: string,
  input: {
    body: string;
    visibility: "PUBLIC" | "PRIVATE";
  }
) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.COMMENTS, PermissionAction.CREATE);

  const comment = await prisma.vehicleComment.create({
    data: {
      vehicleId,
      authorId: auth.user.id,
      body: input.body,
      visibility: input.visibility
    },
    include: {
      author: true
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "COMMENTS",
    action: "CREATE",
    entityType: "vehicle_comment",
    entityId: comment.id
  });

  return comment;
}

export async function deleteVehicleComment(auth: AuthContext, commentId: string) {
  const comment = await prisma.vehicleComment.findUniqueOrThrow({
    where: { id: commentId }
  });

  await ensureVisibleVehicle(auth, comment.vehicleId, PermissionModule.COMMENTS, PermissionAction.DELETE);

  await prisma.vehicleComment.update({
    where: { id: commentId },
    data: {
      deletedAt: new Date(),
      status: WorkflowStatus.ARCHIVED
    }
  });
}

export async function createVehicleCommentRequest(
  auth: AuthContext,
  vehicleId: string,
  input: {
    body: string;
    visibility: "PUBLIC" | "PRIVATE";
  }
) {
  await ensureVisibleVehicle(auth, vehicleId, PermissionModule.COMMENTS, PermissionAction.CREATE);

  return prisma.vehicleCommentRequest.create({
    data: {
      vehicleId,
      requestedById: auth.user.id,
      body: input.body,
      visibility: input.visibility
    }
  });
}

export async function listVehicleCommentRequests() {
  return prisma.vehicleCommentRequest.findMany({
    where: {
      status: WorkflowStatus.PENDING
    },
    include: {
      vehicle: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function reviewVehicleCommentRequest(
  auth: AuthContext,
  requestId: string,
  input: {
    approve: boolean;
    reviewComment?: string | null;
  }
) {
  const request = await prisma.vehicleCommentRequest.findUniqueOrThrow({
    where: { id: requestId }
  });

  if (input.approve) {
    await prisma.vehicleComment.create({
      data: {
        vehicleId: request.vehicleId,
        authorId: request.requestedById,
        body: request.body,
        visibility: request.visibility
      }
    });
  }

  await prisma.vehicleCommentRequest.update({
    where: { id: requestId },
    data: {
      status: input.approve ? WorkflowStatus.APPROVED : WorkflowStatus.REJECTED,
      reviewedById: auth.user.id,
      reviewComment: input.reviewComment ?? null
    }
  });
}
