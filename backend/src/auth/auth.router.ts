import { Router } from "express";
import { authRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  currentUserController,
  forgotPasswordController,
  loginController,
  logoutController,
  resetPasswordController
} from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", authRateLimiter, validateBody(loginSchema), loginController);
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  forgotPasswordController
);
authRouter.post(
  "/reset-password",
  authRateLimiter,
  validateBody(resetPasswordSchema),
  resetPasswordController
);
authRouter.get("/me", requireAuth, currentUserController);
authRouter.post("/logout", logoutController);
