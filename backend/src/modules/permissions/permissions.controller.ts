import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  getPermissionsMatrix,
  getUserPermissions,
  replaceUserPermissions
} from "./permissions.service.js";

export const permissionsMatrixController: RequestHandler = asyncHandler(async (_req, res) => {
  const result = await getPermissionsMatrix();
  res.json(result);
});

export const userPermissionsController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await getUserPermissions(req.auth!, String(req.params.userId));
  res.json(result);
});

export const replaceUserPermissionsController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await replaceUserPermissions(
    req.auth!,
    String(req.params.userId),
    req.body.permissions
  );
  res.json(result);
});
