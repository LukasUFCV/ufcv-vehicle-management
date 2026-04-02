import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import { createOdometerEntry, listVehicleOdometer } from "./odometer.service.js";

export const listVehicleOdometerController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listVehicleOdometer(req.auth!, String(req.params.vehicleId));
  res.json(result);
});

export const createVehicleOdometerController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createOdometerEntry(req.auth!, String(req.params.vehicleId), req.body);
  res.status(201).json({ data: result });
});
