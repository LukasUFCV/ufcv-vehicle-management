import type { RequestHandler } from "express";
import createHttpError from "http-errors";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { env } from "../config/env.js";
import { hashOpaqueToken } from "../lib/session.js";
import { prisma } from "../lib/prisma.js";
import {
  buildPermissionMap,
  collectAuthAttachmentKeys,
  hasPermission,
  type AuthContext
} from "../lib/permissions.js";

async function resolveAuthContext(sessionToken: string): Promise<AuthContext | null> {
  const tokenHash = hashOpaqueToken(sessionToken);

  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
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
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          },
          directPermissions: {
            include: {
              permission: true
            }
          },
          managerLinks: {
            where: { endsAt: null }
          }
        }
      }
    }
  });

  if (!session || !session.user.isActive || session.user.deletedAt) {
    return null;
  }

  const permissionMap = buildPermissionMap([
    ...session.user.roleAssignments.flatMap((assignment) =>
      assignment.role.permissions.map((rolePermission) => ({
        module: rolePermission.permission.module,
        action: rolePermission.permission.action,
        scope: rolePermission.scope
      }))
    ),
    ...session.user.directPermissions.map((userPermission) => ({
      module: userPermission.permission.module,
      action: userPermission.permission.action,
      scope: userPermission.scope
    }))
  ]);

  return {
    sessionId: session.id,
    sessionToken,
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      status: session.user.status,
      roleKeys: session.user.roleAssignments.map((assignment) => assignment.role.key),
      locationIds: session.user.locations.map((link) => link.locationId),
      attachmentKeys: collectAuthAttachmentKeys(
        session.user.attachmentKey,
        session.user.locations
      ),
      managedUserIds: session.user.managerLinks.map((link) => link.reportId)
    },
    permissions: permissionMap
  };
}

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const sessionToken = req.cookies?.[env.SESSION_COOKIE_NAME];

  if (!sessionToken) {
    next();
    return;
  }

  req.auth = await resolveAuthContext(sessionToken);

  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    next(createHttpError(401, "Authentification requise."));
    return;
  }

  next();
};

export function requirePermission(module: PermissionModule, action: PermissionAction): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(createHttpError(401, "Authentification requise."));
      return;
    }

    if (!hasPermission(req.auth, module, action)) {
      next(createHttpError(403, "Droits insuffisants."));
      return;
    }

    next();
  };
}
