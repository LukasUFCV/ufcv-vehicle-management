import createHttpError from "http-errors";
import { UserStatus } from "@prisma/client";
import { env, isProduction } from "../config/env.js";
import { writeAuditLog } from "../lib/audit.js";
import { hashPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { createOpaqueToken, hashOpaqueToken } from "../lib/session.js";
import { LocalIdentityProvider } from "./providers/local.provider.js";

const localIdentityProvider = new LocalIdentityProvider();

function sessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + env.SESSION_TTL_HOURS);
  return expiresAt;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
    signed: false,
    path: "/"
  };
}

export async function buildCurrentUserPayload(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
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
      }
    }
  });

  return {
    id: user.id,
    email: user.email,
    professionalEmail: user.professionalEmail,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    jobTitle: user.jobTitle,
    phone: user.phone,
    status: user.status,
    attachmentKey: user.attachmentKey,
    avatarPath: user.avatarPath,
    locations: user.locations.map((link) => ({
      id: link.location.id,
      name: link.location.name,
      code: link.location.code,
      type: link.location.type,
      isPrimary: link.isPrimary
    })),
    roles: user.roleAssignments.map((assignment) => ({
      key: assignment.role.key,
      name: assignment.role.name
    })),
    permissions: [
      ...user.roleAssignments.flatMap((assignment) =>
        assignment.role.permissions.map((rolePermission) => ({
          source: "role",
          module: rolePermission.permission.module,
          action: rolePermission.permission.action,
          scope: rolePermission.scope
        }))
      ),
      ...user.directPermissions.map((directPermission) => ({
        source: "user",
        module: directPermission.permission.module,
        action: directPermission.permission.action,
        scope: directPermission.scope
      }))
    ]
  };
}

export async function loginWithPassword(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await localIdentityProvider.authenticate({ email, password });

  if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING) {
    throw createHttpError(403, "Compte inactif.");
  }

  const sessionToken = createOpaqueToken();
  const tokenHash = hashOpaqueToken(sessionToken);

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: sessionExpiresAt(),
      ipAddress,
      userAgent
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date()
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    module: "AUTH",
    action: "LOGIN",
    entityType: "user",
    entityId: user.id,
    ipAddress
  });

  return {
    sessionToken,
    sessionId: session.id,
    user: await buildCurrentUserPayload(user.id)
  };
}

export async function logoutBySession(sessionId: string, actorUserId?: string) {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: {
      revokedAt: new Date()
    }
  });

  await writeAuditLog({
    actorUserId,
    module: "AUTH",
    action: "LOGOUT",
    entityType: "session",
    entityId: sessionId
  });
}

export async function createPasswordReset(email: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.trim().toLowerCase() },
        { professionalEmail: email.trim().toLowerCase() }
      ],
      deletedAt: null
    }
  });

  if (!user) {
    return {
      message:
        "Si un compte existe pour cette adresse, un lien de réinitialisation a été préparé."
    };
  }

  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  await writeAuditLog({
    actorUserId: user.id,
    targetUserId: user.id,
    module: "AUTH",
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "user",
    entityId: user.id
  });

  return {
    message:
      "Si un compte existe pour cette adresse, un lien de réinitialisation a été préparé.",
    resetToken: isProduction ? undefined : token,
    expiresAt: isProduction ? undefined : expiresAt.toISOString()
  };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashOpaqueToken(token);
  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!resetRecord) {
    throw createHttpError(400, "Lien de réinitialisation invalide ou expiré.");
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: {
        consumedAt: new Date()
      }
    }),
    prisma.userSession.updateMany({
      where: {
        userId: resetRecord.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
  ]);

  await writeAuditLog({
    actorUserId: resetRecord.userId,
    targetUserId: resetRecord.userId,
    module: "AUTH",
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "user",
    entityId: resetRecord.userId
  });
}
