import { LocationType } from "@prisma/client";
import { z } from "zod";

export const locationsListQuerySchema = z.object({
  search: z.string().optional(),
  type: z.nativeEnum(LocationType).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
});

export const locationInputSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(1),
  type: z.nativeEnum(LocationType),
  attachmentKey: z.string().optional().nullable(),
  parentId: z.string().optional().nullable()
});
