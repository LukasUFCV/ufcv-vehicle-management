import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  createVehicleController,
  deleteVehicleController,
  vehicleBySlugController,
  vehicleDetailController,
  vehicleQrCodeController,
  vehiclesListController,
  updateVehicleController
} from "./vehicles.controller.js";
import { vehicleInputSchema, vehiclesListQuerySchema } from "./vehicles.schemas.js";

export const vehiclesRouter = Router();

vehiclesRouter.get("/scan/:slug", vehicleBySlugController);
vehiclesRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.VEHICLES, PermissionAction.VIEW),
  validateQuery(vehiclesListQuerySchema),
  vehiclesListController
);
vehiclesRouter.get(
  "/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLES, PermissionAction.VIEW),
  vehicleDetailController
);
vehiclesRouter.post(
  "/",
  requireAuth,
  requirePermission(PermissionModule.VEHICLES, PermissionAction.CREATE),
  validateBody(vehicleInputSchema),
  createVehicleController
);
vehiclesRouter.patch(
  "/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLES, PermissionAction.UPDATE),
  validateBody(vehicleInputSchema.partial()),
  updateVehicleController
);
vehiclesRouter.delete(
  "/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLES, PermissionAction.DELETE),
  deleteVehicleController
);
vehiclesRouter.get(
  "/:vehicleId/qrcode",
  requireAuth,
  requirePermission(PermissionModule.VEHICLES, PermissionAction.PRINT),
  vehicleQrCodeController
);
