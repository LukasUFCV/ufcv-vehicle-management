import { InfoVisibility, RequestChangeType } from "@prisma/client";
import { z } from "zod";

export const infoRecordSchema = z.object({
  infoTypeId: z.string(),
  label: z.string().min(1),
  valueText: z.string().optional().nullable(),
  visibility: z.nativeEnum(InfoVisibility).default(InfoVisibility.PRIVATE),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable()
});

export const infoRequestSchema = z.object({
  infoTypeId: z.string(),
  changeType: z.nativeEnum(RequestChangeType),
  payload: z.record(z.any())
});

export const reviewInfoRequestSchema = z.object({
  reviewComment: z.string().optional().nullable(),
  approve: z.boolean()
});
