import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  createLocationController,
  deleteLocationController,
  locationsListController,
  updateLocationController
} from "./locations.controller.js";
import { locationInputSchema, locationsListQuerySchema } from "./locations.schemas.js";

export const locationsRouter = Router();

locationsRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.LOCATIONS, PermissionAction.VIEW),
  validateQuery(locationsListQuerySchema),
  locationsListController
);
locationsRouter.post(
  "/",
  requireAuth,
  requirePermission(PermissionModule.LOCATIONS, PermissionAction.CREATE),
  validateBody(locationInputSchema),
  createLocationController
);
locationsRouter.patch(
  "/:locationId",
  requireAuth,
  requirePermission(PermissionModule.LOCATIONS, PermissionAction.UPDATE),
  validateBody(locationInputSchema.partial()),
  updateLocationController
);
locationsRouter.delete(
  "/:locationId",
  requireAuth,
  requirePermission(PermissionModule.LOCATIONS, PermissionAction.DELETE),
  deleteLocationController
);
