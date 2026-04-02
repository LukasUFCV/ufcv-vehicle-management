import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

type AuditInput = {
  actorUserId?: string | null;
  targetUserId?: string | null;
  module: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,
      module: input.module,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      details: input.details as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? null
    }
  });
}
