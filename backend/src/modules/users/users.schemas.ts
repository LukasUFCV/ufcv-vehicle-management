import { RoleKey, UserStatus } from "@prisma/client";
import { z } from "zod";

export const usersListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
});

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  professionalEmail: z.string().email().optional().nullable(),
  temporaryPassword: z.string().min(8),
  jobTitle: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING),
  attachmentKey: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  locationIds: z.array(z.string()).default([]),
  roleKeys: z.array(z.nativeEnum(RoleKey)).min(1)
});

export const updateUserSchema = createUserSchema
  .omit({ temporaryPassword: true, email: true })
  .extend({
    password: z.string().min(8).optional(),
    email: z.string().email().optional()
  })
  .partial();

export const updateProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  professionalEmail: z.string().email().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  regionLabel: z.string().optional().nullable(),
  cityLabel: z.string().optional().nullable()
});
