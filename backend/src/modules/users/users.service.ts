import createHttpError from "http-errors";
import { PermissionAction, PermissionModule, type Prisma, type RoleKey } from "@prisma/client";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { buildPaginatedResponse, getPagination } from "../../lib/http.js";
import { buildUserVisibilityWhere, type AuthContext } from "../../lib/permissions.js";
import { ensureVisibleUser } from "../../lib/access.js";
import { writeAuditLog } from "../../lib/audit.js";

type ListUsersInput = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function userSearchWhere(search?: string): Prisma.UserWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { professionalEmail: { contains: search } },
      { jobTitle: { contains: search } }
    ]
  };
}

async function resolveRoleIds(roleKeys: RoleKey[]) {
  const roles = await prisma.role.findMany({
    where: {
      key: {
        in: roleKeys
      }
    }
  });

  if (roles.length !== roleKeys.length) {
    throw createHttpError(400, "Certains rôles sont introuvables.");
  }

  return roles.map((role) => role.id);
}

async function replaceUserRoles(userId: string, roleKeys: RoleKey[]) {
  const roleIds = await resolveRoleIds(roleKeys);

  await prisma.userRoleAssignment.deleteMany({
    where: { userId }
  });

  await prisma.userRoleAssignment.createMany({
    data: roleIds.map((roleId) => ({
      userId,
      roleId
    }))
  });
}

async function replaceUserLocations(userId: string, locationIds: string[]) {
  await prisma.userLocation.updateMany({
    where: { userId, endsAt: null },
    data: { endsAt: new Date() }
  });

  if (locationIds.length === 0) {
    return;
  }

  await prisma.userLocation.createMany({
    data: locationIds.map((locationId, index) => ({
      userId,
      locationId,
      isPrimary: index === 0
    }))
  });
}

async function syncManagerRelationship(userId: string, managerId?: string | null) {
  await prisma.managerRelationship.updateMany({
    where: {
      reportId: userId,
      endsAt: null
    },
    data: {
      endsAt: new Date()
    }
  });

  if (!managerId) {
    return;
  }

  await prisma.managerRelationship.create({
    data: {
      managerId,
      reportId: userId,
      isPrimary: true
    }
  });
}

export async function listUsers(auth: AuthContext, input: ListUsersInput) {
  const { page, pageSize, skip } = getPagination(input);

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    AND: [
      buildUserVisibilityWhere(auth, PermissionModule.USERS, PermissionAction.VIEW),
      input.status ? { status: input.status as never } : {},
      userSearchWhere(input.search) ?? {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: pageSize
    }),
    prisma.user.count({ where })
  ]);

  return buildPaginatedResponse(
    items.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      professionalEmail: user.professionalEmail,
      jobTitle: user.jobTitle,
      phone: user.phone,
      status: user.status,
      attachmentKey: user.attachmentKey,
      locations: user.locations.map((link) => ({
        id: link.location.id,
        name: link.location.name,
        code: link.location.code,
        isPrimary: link.isPrimary
      })),
      roles: user.roleAssignments.map((assignment) => assignment.role.name)
    })),
    total,
    page,
    pageSize
  );
}

export async function createUser(auth: AuthContext, input: {
  firstName: string;
  lastName: string;
  email: string;
  professionalEmail?: string | null;
  temporaryPassword: string;
  jobTitle?: string | null;
  phone?: string | null;
  status: string;
  attachmentKey?: string | null;
  managerId?: string | null;
  locationIds: string[];
  roleKeys: RoleKey[];
}) {
  const passwordHash = await hashPassword(input.temporaryPassword);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      professionalEmail: input.professionalEmail?.toLowerCase() ?? null,
      passwordHash,
      jobTitle: input.jobTitle ?? null,
      phone: input.phone ?? null,
      status: input.status as never,
      attachmentKey: input.attachmentKey ?? null,
      managerId: input.managerId ?? null
    }
  });

  await replaceUserRoles(user.id, input.roleKeys);
  await replaceUserLocations(user.id, input.locationIds);
  await syncManagerRelationship(user.id, input.managerId);

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: user.id,
    module: "USERS",
    action: "CREATE",
    entityType: "user",
    entityId: user.id,
    details: {
      roleKeys: input.roleKeys,
      locationIds: input.locationIds
    }
  });

  return ensureVisibleUser(auth, user.id, PermissionModule.USERS, PermissionAction.VIEW);
}

export async function updateUser(
  auth: AuthContext,
  userId: string,
  input: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    professionalEmail?: string | null;
    password: string;
    jobTitle?: string | null;
    phone?: string | null;
    status: string;
    attachmentKey?: string | null;
    managerId?: string | null;
    locationIds: string[];
    roleKeys: RoleKey[];
  }>
) {
  await ensureVisibleUser(auth, userId, PermissionModule.USERS, PermissionAction.UPDATE);

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email?.toLowerCase(),
      professionalEmail: input.professionalEmail?.toLowerCase() ?? input.professionalEmail,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
      jobTitle: input.jobTitle,
      phone: input.phone,
      status: input.status as never,
      attachmentKey: input.attachmentKey,
      managerId: input.managerId
    }
  });

  if (input.roleKeys) {
    await replaceUserRoles(userId, input.roleKeys);
  }

  if (input.locationIds) {
    await replaceUserLocations(userId, input.locationIds);
  }

  if (Object.prototype.hasOwnProperty.call(input, "managerId")) {
    await syncManagerRelationship(userId, input.managerId);
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: userId,
    module: "USERS",
    action: "UPDATE",
    entityType: "user",
    entityId: userId
  });

  return ensureVisibleUser(auth, userId, PermissionModule.USERS, PermissionAction.VIEW);
}

export async function getPersonalProfile(auth: AuthContext) {
  return ensureVisibleUser(auth, auth.user.id, PermissionModule.PERSONAL_PROFILE, PermissionAction.VIEW);
}

export async function updatePersonalProfile(
  auth: AuthContext,
  input: {
    firstName: string;
    lastName: string;
    professionalEmail?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
    regionLabel?: string | null;
    cityLabel?: string | null;
  }
) {
  await prisma.user.update({
    where: { id: auth.user.id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      professionalEmail: input.professionalEmail?.toLowerCase() ?? input.professionalEmail,
      jobTitle: input.jobTitle ?? null,
      phone: input.phone ?? null,
      regionLabel: input.regionLabel ?? null,
      cityLabel: input.cityLabel ?? null
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    targetUserId: auth.user.id,
    module: "PERSONAL_PROFILE",
    action: "UPDATE",
    entityType: "user",
    entityId: auth.user.id
  });

  return getPersonalProfile(auth);
}
