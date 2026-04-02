import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  createLocation,
  deleteLocation,
  listLocations,
  updateLocation
} from "./locations.service.js";

export const locationsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listLocations(req.query);
  res.json(result);
});

export const createLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createLocation(req.auth!, req.body);
  res.status(201).json({ data: result });
});

export const updateLocationController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await updateLocation(req.auth!, String(req.params.locationId), req.body);
  res.json({ data: result });
});

export const deleteLocationController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteLocation(req.auth!, String(req.params.locationId));
  res.status(204).send();
});
