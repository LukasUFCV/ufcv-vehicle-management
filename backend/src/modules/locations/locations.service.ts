import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { buildPaginatedResponse, getPagination } from "../../lib/http.js";
import { writeAuditLog } from "../../lib/audit.js";
import type { AuthContext } from "../../lib/permissions.js";

type ListLocationsInput = {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
};

async function rebuildLocationClosure(locationId: string, parentId?: string | null) {
  await prisma.locationHierarchy.deleteMany({
    where: {
      descendantId: locationId
    }
  });

  await prisma.locationHierarchy.create({
    data: {
      ancestorId: locationId,
      descendantId: locationId,
      depth: 0
    }
  });

  if (!parentId) {
    return;
  }

  const parentAncestors = await prisma.locationHierarchy.findMany({
    where: {
      descendantId: parentId
    }
  });

  if (parentAncestors.length === 0) {
    await prisma.locationHierarchy.create({
      data: {
        ancestorId: parentId,
        descendantId: locationId,
        depth: 1
      }
    });

    return;
  }

  await prisma.locationHierarchy.createMany({
    data: parentAncestors.map((ancestor) => ({
      ancestorId: ancestor.ancestorId,
      descendantId: locationId,
      depth: ancestor.depth + 1
    }))
  });
}

export async function listLocations(input: ListLocationsInput) {
  const { page, pageSize, skip } = getPagination(input);
  const where: Prisma.LocationWhereInput = {
    deletedAt: null,
    ...(input.type ? { type: input.type as never } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search } },
            { code: { contains: input.search } },
            { attachmentKey: { contains: input.search } }
          ]
        }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.location.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: { deletedAt: null }
        }
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      skip,
      take: pageSize
    }),
    prisma.location.count({ where })
  ]);

  return buildPaginatedResponse(items, total, page, pageSize);
}

export async function createLocation(
  auth: AuthContext,
  input: {
    code: string;
    name: string;
    type: string;
    attachmentKey?: string | null;
    parentId?: string | null;
  }
) {
  const location = await prisma.location.create({
    data: {
      code: input.code,
      name: input.name,
      type: input.type as never,
      attachmentKey: input.attachmentKey ?? null,
      parentId: input.parentId ?? null
    }
  });

  await rebuildLocationClosure(location.id, input.parentId);

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "LOCATIONS",
    action: "CREATE",
    entityType: "location",
    entityId: location.id
  });

  return location;
}

export async function updateLocation(
  auth: AuthContext,
  locationId: string,
  input: {
    code?: string;
    name?: string;
    type?: string;
    attachmentKey?: string | null;
    parentId?: string | null;
  }
) {
  const location = await prisma.location.update({
    where: { id: locationId },
    data: {
      code: input.code,
      name: input.name,
      type: input.type as never,
      attachmentKey: input.attachmentKey,
      parentId: input.parentId
    }
  });

  if (Object.prototype.hasOwnProperty.call(input, "parentId")) {
    await rebuildLocationClosure(locationId, input.parentId);
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "LOCATIONS",
    action: "UPDATE",
    entityType: "location",
    entityId: locationId
  });

  return location;
}

export async function deleteLocation(auth: AuthContext, locationId: string) {
  await prisma.location.update({
    where: { id: locationId },
    data: {
      deletedAt: new Date()
    }
  });

  await writeAuditLog({
    actorUserId: auth.user.id,
    module: "LOCATIONS",
    action: "DELETE",
    entityType: "location",
    entityId: locationId
  });
}
