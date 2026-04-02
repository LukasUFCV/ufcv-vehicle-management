import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createUserInfoController,
  createUserInfoRequestController,
  createVehicleInfoController,
  createVehicleInfoRequestController,
  deleteUserInfoController,
  deleteVehicleInfoController,
  infoTypesListController,
  infoRequestsListController,
  reviewUserInfoRequestController,
  reviewVehicleInfoRequestController,
  userInfosListController,
  vehicleInfosListController
} from "./infos.controller.js";
import {
  infoRecordSchema,
  infoRequestSchema,
  reviewInfoRequestSchema
} from "./infos.schemas.js";

export const infosRouter = Router();

infosRouter.get(
  "/types",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.VIEW),
  infoTypesListController
);
infosRouter.get(
  "/users/:userId",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.VIEW),
  userInfosListController
);
infosRouter.post(
  "/users/:userId",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.CREATE),
  validateBody(infoRecordSchema),
  createUserInfoController
);
infosRouter.delete(
  "/users/records/:infoId",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.DELETE),
  deleteUserInfoController
);
infosRouter.post(
  "/users/:userId/requests",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.CREATE),
  validateBody(infoRequestSchema),
  createUserInfoRequestController
);
infosRouter.get(
  "/vehicles/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLE_INFOS, PermissionAction.VIEW),
  vehicleInfosListController
);
infosRouter.post(
  "/vehicles/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLE_INFOS, PermissionAction.CREATE),
  validateBody(infoRecordSchema),
  createVehicleInfoController
);
infosRouter.delete(
  "/vehicles/records/:infoId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLE_INFOS, PermissionAction.DELETE),
  deleteVehicleInfoController
);
infosRouter.post(
  "/vehicles/:vehicleId/requests",
  requireAuth,
  requirePermission(PermissionModule.VEHICLE_INFOS, PermissionAction.CREATE),
  validateBody(infoRequestSchema),
  createVehicleInfoRequestController
);
infosRouter.get(
  "/requests",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.VALIDATE),
  infoRequestsListController
);
infosRouter.patch(
  "/requests/users/:requestId",
  requireAuth,
  requirePermission(PermissionModule.USER_INFOS, PermissionAction.VALIDATE),
  validateBody(reviewInfoRequestSchema),
  reviewUserInfoRequestController
);
infosRouter.patch(
  "/requests/vehicles/:requestId",
  requireAuth,
  requirePermission(PermissionModule.VEHICLE_INFOS, PermissionAction.VALIDATE),
  validateBody(reviewInfoRequestSchema),
  reviewVehicleInfoRequestController
);
