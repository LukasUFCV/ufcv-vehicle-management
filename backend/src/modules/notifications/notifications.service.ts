import type { AuthContext } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";

export async function listNotifications(auth: AuthContext) {
  return prisma.notification.findMany({
    where: {
      userId: auth.user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });
}

export async function markNotificationRead(auth: AuthContext, notificationId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: auth.user.id
    },
    data: {
      readAt: new Date()
    }
  });
}
