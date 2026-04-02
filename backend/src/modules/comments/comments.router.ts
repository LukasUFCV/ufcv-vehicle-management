import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createVehicleCommentController,
  createVehicleCommentRequestController,
  deleteVehicleCommentController,
  reviewVehicleCommentRequestController,
  vehicleCommentRequestsListController,
  vehicleCommentsListController
} from "./comments.controller.js";
import { reviewCommentRequestSchema, vehicleCommentSchema } from "./comments.schemas.js";

export const commentsRouter = Router();

commentsRouter.get(
  "/vehicles/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.COMMENTS, PermissionAction.VIEW),
  vehicleCommentsListController
);
commentsRouter.post(
  "/vehicles/:vehicleId",
  requireAuth,
  requirePermission(PermissionModule.COMMENTS, PermissionAction.CREATE),
  validateBody(vehicleCommentSchema),
  createVehicleCommentController
);
commentsRouter.delete(
  "/vehicles/records/:commentId",
  requireAuth,
  requirePermission(PermissionModule.COMMENTS, PermissionAction.DELETE),
  deleteVehicleCommentController
);
commentsRouter.post(
  "/vehicles/:vehicleId/requests",
  requireAuth,
  requirePermission(PermissionModule.COMMENTS, PermissionAction.CREATE),
  validateBody(vehicleCommentSchema),
  createVehicleCommentRequestController
);
commentsRouter.get(
  "/requests",
  requireAuth,
  requirePermission(PermissionModule.COMMENTS, PermissionAction.VALIDATE),
  vehicleCommentRequestsListController
);
commentsRouter.patch(
  "/requests/:requestId",
  requireAuth,
  requirePermission(PermissionModule.COMMENTS, PermissionAction.VALIDATE),
  validateBody(reviewCommentRequestSchema),
  reviewVehicleCommentRequestController
);
