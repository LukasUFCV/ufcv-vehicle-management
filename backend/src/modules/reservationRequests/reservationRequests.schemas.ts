import { z } from "zod";

export const reservationRequestsListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
});

export const reservationRequestInputSchema = z.object({
  requestedForId: z.string(),
  vehicleId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  analyticsCodeId: z.string().optional().nullable(),
  departureAt: z.string().datetime(),
  arrivalAt: z.string().datetime(),
  destination: z.string().min(1),
  notes: z.string().optional().nullable()
});

export const reviewRequestSchema = z.object({
  reviewComment: z.string().optional().nullable()
});
