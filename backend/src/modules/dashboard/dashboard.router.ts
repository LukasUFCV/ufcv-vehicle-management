import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { dashboardSummaryController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  requireAuth,
  requirePermission(PermissionModule.DASHBOARD, PermissionAction.VIEW),
  dashboardSummaryController
);
