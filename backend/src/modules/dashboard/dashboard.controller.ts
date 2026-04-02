import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import { getDashboardSummary } from "./dashboard.service.js";

export const dashboardSummaryController: RequestHandler = asyncHandler(async (req, res) => {
  const data = await getDashboardSummary(req.auth!);

  res.json(data);
});
