import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import { conflictsListController, resolveConflictController } from "./conflicts.controller.js";
import { conflictsListQuerySchema, resolveConflictSchema } from "./conflicts.schemas.js";

export const conflictsRouter = Router();

conflictsRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.CONFLICTS, PermissionAction.VIEW),
  validateQuery(conflictsListQuerySchema),
  conflictsListController
);
conflictsRouter.patch(
  "/:conflictId/resolve",
  requireAuth,
  requirePermission(PermissionModule.CONFLICTS, PermissionAction.MANAGE),
  validateBody(resolveConflictSchema),
  resolveConflictController
);
