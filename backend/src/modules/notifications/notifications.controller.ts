import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import { listNotifications, markNotificationRead } from "./notifications.service.js";

export const notificationsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listNotifications(req.auth!);
  res.json({ data: result });
});

export const markNotificationReadController: RequestHandler = asyncHandler(async (req, res) => {
  await markNotificationRead(req.auth!, String(req.params.notificationId));
  res.status(204).send();
});
