import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  createUserInfo,
  createUserInfoRequest,
  createVehicleInfo,
  createVehicleInfoRequest,
  deleteUserInfo,
  deleteVehicleInfo,
  listInfoTypes,
  listInfoRequests,
  listUserInfos,
  listVehicleInfos,
  reviewUserInfoRequest,
  reviewVehicleInfoRequest
} from "./infos.service.js";

export const userInfosListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listUserInfos(req.auth!, String(req.params.userId));
  res.json({ data: result });
});

export const createUserInfoController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createUserInfo(req.auth!, String(req.params.userId), req.body);
  res.status(201).json({ data: result });
});

export const deleteUserInfoController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteUserInfo(req.auth!, String(req.params.infoId));
  res.status(204).send();
});

export const createUserInfoRequestController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createUserInfoRequest(req.auth!, String(req.params.userId), req.body);
  res.status(201).json({ data: result });
});

export const vehicleInfosListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listVehicleInfos(req.auth!, String(req.params.vehicleId));
  res.json({ data: result });
});

export const createVehicleInfoController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createVehicleInfo(req.auth!, String(req.params.vehicleId), req.body);
  res.status(201).json({ data: result });
});

export const deleteVehicleInfoController: RequestHandler = asyncHandler(async (req, res) => {
  await deleteVehicleInfo(req.auth!, String(req.params.infoId));
  res.status(204).send();
});

export const createVehicleInfoRequestController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createVehicleInfoRequest(req.auth!, String(req.params.vehicleId), req.body);
  res.status(201).json({ data: result });
});

export const infoRequestsListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listInfoRequests(req.auth!);
  res.json(result);
});

export const infoTypesListController: RequestHandler = asyncHandler(async (req, res) => {
  const entityType = req.query.entityType === "VEHICLE" ? "VEHICLE" : "USER";
  const result = await listInfoTypes(entityType);
  res.json({ data: result });
});

export const reviewUserInfoRequestController: RequestHandler = asyncHandler(async (req, res) => {
  await reviewUserInfoRequest(req.auth!, String(req.params.requestId), req.body);
  res.status(204).send();
});

export const reviewVehicleInfoRequestController: RequestHandler = asyncHandler(async (req, res) => {
  await reviewVehicleInfoRequest(req.auth!, String(req.params.requestId), req.body);
  res.status(204).send();
});
