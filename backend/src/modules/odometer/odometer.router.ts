import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createVehicleOdometerController,
  listVehicleOdometerController
} from "./odometer.controller.js";
import { odometerEntrySchema } from "./odometer.schemas.js";

export const odometerRouter = Router();

odometerRouter.get(
  "/vehicles/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.ODOMETER, PermissionAction.VIEW),
  listVehicleOdometerController
);
odometerRouter.post(
  "/vehicles/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.ODOMETER, PermissionAction.CREATE),
  validateBody(odometerEntrySchema),
  createVehicleOdometerController
);
