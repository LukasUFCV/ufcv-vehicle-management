import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import {
  markNotificationReadController,
  notificationsListController
} from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.NOTIFICATIONS, PermissionAction.VIEW),
  notificationsListController
);
notificationsRouter.patch(
  "/:notificationId/read",
  requireAuth,
  requirePermission(PermissionModule.NOTIFICATIONS, PermissionAction.VIEW),
  markNotificationReadController
);
