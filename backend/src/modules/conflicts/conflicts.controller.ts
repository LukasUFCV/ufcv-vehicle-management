import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import { listConflicts, resolveConflict } from "./conflicts.service.js";

export const conflictsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listConflicts(req.auth!, req.query);
  res.json(result);
});

export const resolveConflictController: RequestHandler = asyncHandler(async (req, res) => {
  await resolveConflict(req.auth!, String(req.params.conflictId), req.body);
  res.status(204).send();
});
