import { Router } from "express";
import { PermissionAction, PermissionModule } from "@prisma/client";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  createUserController,
  personalProfileController,
  updatePersonalProfileController,
  updateUserController,
  usersListController
} from "./users.controller.js";
import {
  createUserSchema,
  updateProfileSchema,
  updateUserSchema,
  usersListQuerySchema
} from "./users.schemas.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  requirePermission(PermissionModule.USERS, PermissionAction.VIEW),
  validateQuery(usersListQuerySchema),
  usersListController
);
usersRouter.post(
  "/",
  requireAuth,
  requirePermission(PermissionModule.USERS, PermissionAction.CREATE),
  validateBody(createUserSchema),
  createUserController
);
usersRouter.patch(
  "/:userId",
  requireAuth,
  requirePermission(PermissionModule.USERS, PermissionAction.UPDATE),
  validateBody(updateUserSchema),
  updateUserController
);
usersRouter.get(
  "/me/profile",
  requireAuth,
  requirePermission(PermissionModule.PERSONAL_PROFILE, PermissionAction.VIEW),
  personalProfileController
);
usersRouter.patch(
  "/me/profile",
  requireAuth,
  requirePermission(PermissionModule.PERSONAL_PROFILE, PermissionAction.UPDATE),
  validateBody(updateProfileSchema),
  updatePersonalProfileController
);
