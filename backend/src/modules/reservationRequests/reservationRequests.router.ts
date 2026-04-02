import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  approveReservationRequestController,
  createReservationRequestController,
  rejectReservationRequestController,
  reservationRequestsListController
} from "./reservationRequests.controller.js";
import {
  reservationRequestInputSchema,
  reservationRequestsListQuerySchema,
  reviewRequestSchema
} from "./reservationRequests.schemas.js";

export const reservationRequestsRouter = Router();

reservationRequestsRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.REQUESTS, PermissionAction.VIEW),
  validateQuery(reservationRequestsListQuerySchema),
  reservationRequestsListController
);
reservationRequestsRouter.post(
  "/",
  requireAuth,
  requirePermission(PermissionModule.REQUESTS, PermissionAction.CREATE),
  validateBody(reservationRequestInputSchema),
  createReservationRequestController
);
reservationRequestsRouter.patch(
  "/:requestId/approve",
  requireAuth,
  requirePermission(PermissionModule.REQUESTS, PermissionAction.VALIDATE),
  validateBody(reviewRequestSchema),
  approveReservationRequestController
);
reservationRequestsRouter.patch(
  "/:requestId/reject",
  requireAuth,
  requirePermission(PermissionModule.REQUESTS, PermissionAction.REJECT),
  validateBody(reviewRequestSchema),
  rejectReservationRequestController
);
