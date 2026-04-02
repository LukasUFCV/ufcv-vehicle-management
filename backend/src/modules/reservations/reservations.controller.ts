import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  analyticsAutocomplete,
  createReservation,
  deleteReservation,
  listReservations,
  updateReservation
} from "./reservations.service.js";

export const reservationsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listReservations(req.auth!, req.query);
  res.json(result);
});

export const createReservationController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createReservation(req.auth!, req.body);
  res.status(201).json({ data: result });
});

export const updateReservationController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await updateReservation(req.auth!, String(req.params.reservationId), req.body);
  res.json({ data: result });
});

export const deleteReservationController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteReservation(req.auth!, String(req.params.reservationId));
  res.status(204).send();
});

export const analyticsLookupController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await analyticsAutocomplete(typeof req.query.search === "string" ? req.query.search : undefined);
  res.json({ data: result });
});
