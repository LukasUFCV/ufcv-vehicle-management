import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  permissionsMatrixController,
  replaceUserPermissionsController,
  userPermissionsController
} from "./permissions.controller.js";
import { replaceUserPermissionsSchema } from "./permissions.schemas.js";

export const permissionsRouter = Router();

permissionsRouter.get(
  "/matrix",
  requireAuth,
  requirePermission(PermissionModule.PERMISSIONS, PermissionAction.VIEW),
  permissionsMatrixController
);
permissionsRouter.get(
  "/users/:userId",
  requireAuth,
  requirePermission(PermissionModule.PERMISSIONS, PermissionAction.VIEW),
  userPermissionsController
);
permissionsRouter.put(
  "/users/:userId",
  requireAuth,
  requirePermission(PermissionModule.PERMISSIONS, PermissionAction.MANAGE),
  validateBody(replaceUserPermissionsSchema),
  replaceUserPermissionsController
);
