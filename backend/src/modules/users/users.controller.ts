import type { RequestHandler } from "express";
import { asyncHandler } from "../../lib/http.js";
import {
  createUser,
  getPersonalProfile,
  listUsers,
  updatePersonalProfile,
  updateUser
} from "./users.service.js";

export const usersListController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await listUsers(req.auth!, req.query);
  res.json(result);
});

export const createUserController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createUser(req.auth!, req.body);
  res.status(201).json({ data: result });
});

export const updateUserController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await updateUser(req.auth!, String(req.params.userId), req.body);
  res.json({ data: result });
});

export const personalProfileController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await getPersonalProfile(req.auth!);
  res.json({ data: result });
});

export const updatePersonalProfileController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await updatePersonalProfile(req.auth!, req.body);
  res.json({ data: result });
});
