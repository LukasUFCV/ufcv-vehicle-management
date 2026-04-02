import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateQuery } from "../../middlewares/validate.middleware.js";
import {
  downloadFileController,
  filesListController,
  uploadFileController,
  uploadMiddleware
} from "./files.controller.js";
import { filesListQuerySchema } from "./files.schemas.js";

export const filesRouter = Router();

filesRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.FILES, PermissionAction.VIEW),
  validateQuery(filesListQuerySchema),
  filesListController
);
filesRouter.post(
  "/upload",
  requireAuth,
  requirePermission(PermissionModule.FILES, PermissionAction.CREATE),
  uploadMiddleware.single("file"),
  uploadFileController
);
filesRouter.get(
  "/:attachmentId",
  requireAuth,
  requirePermission(PermissionModule.FILES, PermissionAction.VIEW),
  downloadFileController
);
