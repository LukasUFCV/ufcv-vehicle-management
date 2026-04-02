import { PermissionAction, PermissionModule } from "@prisma/client";
import { ensureVisibleUser } from "../../lib/access.js";
import type { AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";

export async function getPermissionsMatrix() {
  const [permissions, roles] = await Promise.all([
    prisma.permission.findMany({
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      },
      orderBy: [{ module: "asc" }, { action: "asc" }]
    }),
    prisma.role.findMany({
      orderBy: {
        name: "asc"
      }
    })
  ]);

  return {
    roles,
    permissions
  };
}

export async function getUserPermissions(auth: AuthContext, userId: string) {
  const user = await ensureVisibleUser(auth, userId, PermissionModule.PERMISSIONS, PermissionAction.VIEW);

  const directPermissions = await prisma.userPermission.findMany({
    where: { userId },
    include: {
      permission: true
    }
  });

  return {
    user,
    directPermissions
  };
}

export async function replaceUserPermissions(
  auth: AuthContext,
  userId: string,
  permissions: Array<{ permissionId: string; scope: string }>
) {
  await ensureVisibleUser(auth, userId, PermissionModule.PERMISSIONS, PermissionAction.MANAGE);

  await prisma.$transaction([
    prisma.userPermission.deleteMany({
      where: { userId }
    }),
    prisma.userPermission.createMany({
      data: permissions.map((permission) => ({
        userId,
        permissionId: permission.permissionId,
        scope: permission.scope
      }))
    })
  ]);

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: userId,
    module: "PERMISSIONS",
    action: "UPDATE",
    entityType: "user_permission",
    entityId: userId
  });

  return getUserPermissions(auth, userId);
}
