import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/http.js";
import {
  buildCurrentUserPayload,
  createPasswordReset,
  getSessionCookieOptions,
  loginWithPassword,
  logoutBySession,
  resetPassword
} from "./auth.service.js";
import { env } from "../config/env.js";

export const loginController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await loginWithPassword(
    req.body.email,
    req.body.password,
    req.ip,
    req.get("user-agent")
  );

  res.cookie(env.SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieOptions());

  res.json({
    message: "Connexion réussie.",
    user: result.user
  });
});

export const logoutController: RequestHandler = asyncHandler(async (req, res) => {
  if (req.auth) {
    await logoutBySession(req.auth.sessionId, req.auth.user.id);
  }

  res.clearCookie(env.SESSION_COOKIE_NAME, getSessionCookieOptions());
  res.status(204).send();
});

export const currentUserController: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.auth) {
    res.status(401).json({
      message: "Authentification requise."
    });
    return;
  }

  const user = await buildCurrentUserPayload(req.auth.user.id);

  res.json({ user });
});

export const forgotPasswordController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createPasswordReset(req.body.email);

  res.json(result);
});

export const resetPasswordController: RequestHandler = asyncHandler(async (req, res) => {
  await resetPassword(req.body.token, req.body.password);

  res.json({
    message: "Mot de passe réinitialisé."
  });
});
