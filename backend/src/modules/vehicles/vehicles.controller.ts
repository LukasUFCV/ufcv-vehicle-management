import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  createVehicle,
  deleteVehicle,
  getVehicleBySlug,
  getVehicleDetails,
  getVehicleQrCode,
  listVehicles,
  updateVehicle
} from "./vehicles.service.js";

export const vehiclesListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listVehicles(req.auth!, req.query);
  res.json(result);
});

export const vehicleDetailController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await getVehicleDetails(req.auth!, String(req.params.vehicleId));
  res.json({ data: result });
});

export const createVehicleController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createVehicle(req.auth!, req.body);
  res.status(201).json({ data: result });
});

export const updateVehicleController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await updateVehicle(req.auth!, String(req.params.vehicleId), req.body);
  res.json({ data: result });
});

export const deleteVehicleController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteVehicle(req.auth!, String(req.params.vehicleId));
  res.status(204).send();
});

export const vehicleQrCodeController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await getVehicleQrCode(req.auth!, String(req.params.vehicleId));
  res.json(result);
});

export const vehicleBySlugController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await getVehicleBySlug(req.auth ?? null, String(req.params.slug));

  if (!result) {
    res.status(404).json({
      message: "Véhicule introuvable."
    });
    return;
  }

  res.json({ data: result });
});
