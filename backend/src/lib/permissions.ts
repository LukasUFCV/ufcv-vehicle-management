import {
  PermissionAction,
  PermissionModule,
  type Prisma,
  RoleKey,
  type UserLocation
} from "@prisma/client";

export type PermissionKey = `${PermissionModule}:${PermissionAction}`;

export type AuthContext = {
  sessionId: string;
  sessionToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    roleKeys: RoleKey[];
    locationIds: string[];
    attachmentKeys: string[];
    managedUserIds: string[];
  };
  permissions: Record<PermissionKey, string[]>;
};

export function permissionKey(module: PermissionModule, action: PermissionAction) {
  return `${module}:${action}` as PermissionKey;
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

export function buildPermissionMap(
  grants: Array<{
    module: PermissionModule;
    action: PermissionAction;
    scope: string;
  }>
) {
  return grants.reduce(
    (accumulator, grant) => {
      const key = permissionKey(grant.module, grant.action);
      const current = accumulator[key] ?? [];

      accumulator[key] = uniqueStrings([...current, grant.scope]);

      return accumulator;
    },
    {} as Record<PermissionKey, string[]>
  );
}

export function getGrantedScopes(
  auth: AuthContext,
  module: PermissionModule,
  action: PermissionAction
) {
  return auth.permissions[permissionKey(module, action)] ?? [];
}

export function hasPermission(
  auth: AuthContext,
  module: PermissionModule,
  action: PermissionAction
) {
  return getGrantedScopes(auth, module, action).length > 0;
}

export function buildUserVisibilityWhere(
  auth: AuthContext,
  module: PermissionModule,
  action: PermissionAction
): Prisma.UserWhereInput {
  const scopes = getGrantedScopes(auth, module, action);

  if (scopes.includes("ALL")) {
    return {};
  }

  const clauses: Prisma.UserWhereInput[] = [];

  if (scopes.includes("SELF")) {
    clauses.push({ id: auth.user.id });
  }

  if (scopes.includes("MANAGER")) {
    clauses.push({
      OR: [{ managerId: auth.user.id }, { id: { in: auth.user.managedUserIds } }]
    });
  }

  if (scopes.includes("LOCATION") && auth.user.locationIds.length > 0) {
    clauses.push({
      locations: {
        some: {
          locationId: { in: auth.user.locationIds },
          endsAt: null
        }
      }
    });
  }

  if (scopes.includes("ATTACHMENT") && auth.user.attachmentKeys.length > 0) {
    clauses.push({
      attachmentKey: { in: auth.user.attachmentKeys }
    });
  }

  if (clauses.length === 0) {
    return { id: "__forbidden__" };
  }

  return { OR: clauses };
}

export function buildVehicleVisibilityWhere(
  auth: AuthContext,
  module: PermissionModule,
  action: PermissionAction
): Prisma.VehicleWhereInput {
  const scopes = getGrantedScopes(auth, module, action);

  if (scopes.includes("ALL")) {
    return {};
  }

  const clauses: Prisma.VehicleWhereInput[] = [];

  if (scopes.includes("LOCATION") && auth.user.locationIds.length > 0) {
    clauses.push({
      OR: [
        { currentLocationId: { in: auth.user.locationIds } },
        {
          locations: {
            some: {
              locationId: { in: auth.user.locationIds },
              releasedAt: null
            }
          }
        }
      ]
    });
  }

  if (scopes.includes("ATTACHMENT") && auth.user.attachmentKeys.length > 0) {
    clauses.push({
      attachmentKey: { in: auth.user.attachmentKeys }
    });
  }

  if (clauses.length === 0) {
    return { id: "__forbidden__" };
  }

  return { OR: clauses };
}

export function buildReservationVisibilityWhere(
  auth: AuthContext
): Prisma.ReservationWhereInput {
  const scopes = getGrantedScopes(auth, PermissionModule.RESERVATIONS, PermissionAction.VIEW);

  if (scopes.includes("ALL")) {
    return {};
  }

  const clauses: Prisma.ReservationWhereInput[] = [];

  if (scopes.includes("SELF")) {
    clauses.push({ userId: auth.user.id });
  }

  if (scopes.includes("MANAGER")) {
    clauses.push({
      user: {
        OR: [{ managerId: auth.user.id }, { id: { in: auth.user.managedUserIds } }]
      }
    });
  }

  if (scopes.includes("LOCATION") && auth.user.locationIds.length > 0) {
    clauses.push({
      OR: [
        {
          user: {
            locations: {
              some: {
                locationId: { in: auth.user.locationIds },
                endsAt: null
              }
            }
          }
        },
        {
          vehicle: {
            OR: [
              { currentLocationId: { in: auth.user.locationIds } },
              {
                locations: {
                  some: {
                    locationId: { in: auth.user.locationIds },
                    releasedAt: null
                  }
                }
              }
            ]
          }
        }
      ]
    });
  }

  if (scopes.includes("ATTACHMENT") && auth.user.attachmentKeys.length > 0) {
    clauses.push({
      OR: [
        {
          user: {
            attachmentKey: { in: auth.user.attachmentKeys }
          }
        },
        {
          vehicle: {
            attachmentKey: { in: auth.user.attachmentKeys }
          }
        }
      ]
    });
  }

  if (clauses.length === 0) {
    return { id: "__forbidden__" };
  }

  return { OR: clauses };
}

export function collectAuthAttachmentKeys(
  attachmentKey: string | null,
  locations: Array<UserLocation & { location: { attachmentKey: string | null } }>
) {
  return uniqueStrings([
    attachmentKey,
    ...locations.map((locationLink) => locationLink.location.attachmentKey)
  ]);
}
