import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  analyticsLookupController,
  createReservationController,
  deleteReservationController,
  reservationsListController,
  updateReservationController
} from "./reservations.controller.js";
import {
  analyticsLookupSchema,
  reservationInputSchema,
  reservationsListQuerySchema
} from "./reservations.schemas.js";

export const reservationsRouter = Router();

reservationsRouter.get(
  "/lookup/analytics",
  requireAuth,
  requirePermission(PermissionModule.RESERVATIONS, PermissionAction.VIEW),
  validateQuery(analyticsLookupSchema),
  analyticsLookupController
);
reservationsRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.RESERVATIONS, PermissionAction.VIEW),
  validateQuery(reservationsListQuerySchema),
  reservationsListController
);
reservationsRouter.post(
  "/",
  requireAuth,
  requirePermission(PermissionModule.RESERVATIONS, PermissionAction.CREATE),
  validateBody(reservationInputSchema),
  createReservationController
);
reservationsRouter.patch(
  "/:reservationId",
  requireAuth,
  requirePermission(PermissionModule.RESERVATIONS, PermissionAction.UPDATE),
  validateBody(reservationInputSchema.partial()),
  updateReservationController
);
reservationsRouter.delete(
  "/:reservationId",
  requireAuth,
  requirePermission(PermissionModule.RESERVATIONS, PermissionAction.DELETE),
  deleteReservationController
);
