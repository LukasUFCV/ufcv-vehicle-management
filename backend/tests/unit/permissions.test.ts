import { describe, expect, it } from "vitest";
import { PermissionAction, PermissionModule, RoleKey } from "@prisma/client";
import {
  buildPermissionMap,
  buildUserVisibilityWhere,
  permissionKey,
  type AuthContext
} from "../../src/lib/permissions.js";

const auth: AuthContext = {
  sessionId: "session-1",
  sessionToken: "token",
  user: {
    id: "user-1",
    email: "test@ufcv.local",
    firstName: "Test",
    lastName: "User",
    status: "ACTIVE",
    roleKeys: [RoleKey.USER],
    locationIds: ["loc-1"],
    attachmentKeys: ["ATT-1"],
    managedUserIds: ["user-2"]
  },
  permissions: buildPermissionMap([
    {
      module: PermissionModule.USERS,
      action: PermissionAction.VIEW,
      scope: "SELF"
    },
    {
      module: PermissionModule.USERS,
      action: PermissionAction.VIEW,
      scope: "MANAGER"
    }
  ])
};

describe("permissions", () => {
  it("compose correctement la clé de permission", () => {
    expect(permissionKey(PermissionModule.USERS, PermissionAction.VIEW)).toBe("USERS:VIEW");
  });

  it("construit un filtre de visibilité utilisateur à partir des scopes", () => {
    const where = buildUserVisibilityWhere(auth, PermissionModule.USERS, PermissionAction.VIEW);

    expect(where).toEqual({
      OR: [{ id: "user-1" }, { OR: [{ managerId: "user-1" }, { id: { in: ["user-2"] } }] }]
    });
  });
});
