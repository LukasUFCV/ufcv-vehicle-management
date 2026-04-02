import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  approveReservationRequest,
  createReservationRequest,
  listReservationRequests,
  rejectReservationRequest
} from "./reservationRequests.service.js";

export const reservationRequestsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listReservationRequests(req.auth!, req.query);
  res.json(result);
});

export const createReservationRequestController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createReservationRequest(req.auth!, req.body);
  res.status(201).json({ data: result });
});

export const approveReservationRequestController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await approveReservationRequest(
    req.auth!,
    String(req.params.requestId),
    req.body.reviewComment
  );
  res.json({ data: result });
});

export const rejectReservationRequestController: RequestHandler = asyncHandler(async (req, res) => {
  await rejectReservationRequest(
    req.auth!,
    String(req.params.requestId),
    req.body.reviewComment
  );
  res.status(204).send();
});
