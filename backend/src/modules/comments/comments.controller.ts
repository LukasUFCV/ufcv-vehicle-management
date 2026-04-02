import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  createVehicleComment,
  createVehicleCommentRequest,
  deleteVehicleComment,
  listVehicleCommentRequests,
  listVehicleComments,
  reviewVehicleCommentRequest
} from "./comments.service.js";

export const vehicleCommentsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listVehicleComments(req.auth!, String(req.params.vehicleId));
  res.json({ data: result });
});

export const createVehicleCommentController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createVehicleComment(req.auth!, String(req.params.vehicleId), req.body);
  res.status(201).json({ data: result });
});

export const deleteVehicleCommentController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteVehicleComment(req.auth!, String(req.params.commentId));
  res.status(204).send();
});

export const createVehicleCommentRequestController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createVehicleCommentRequest(
    req.auth!,
    String(req.params.vehicleId),
    req.body
  );
  res.status(201).json({ data: result });
});

export const vehicleCommentRequestsListController: RequestHandler = asyncHandler(async (_req, res) => {
  const result = await listVehicleCommentRequests();
  res.json({ data: result });
});

export const reviewVehicleCommentRequestController: RequestHandler = asyncHandler(async (req, res) => {
  await reviewVehicleCommentRequest(req.auth!, String(req.params.requestId), req.body);
  res.status(204).send();
});
