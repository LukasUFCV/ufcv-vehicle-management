import { ReservationStatus } from "@prisma/client";
import { z } from "zod";

export const reservationsListQuerySchema = z.object({
  search: z.string().optional(),
  userId: z.string().optional(),
  vehicleId: z.string().optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
});

export const reservationInputSchema = z.object({
  userId: z.string(),
  vehicleId: z.string(),
  activityId: z.string().optional().nullable(),
  analyticsCodeId: z.string().optional().nullable(),
  departureAt: z.string().datetime(),
  arrivalAt: z.string().datetime(),
  departureLocationId: z.string().optional().nullable(),
  arrivalLocationId: z.string().optional().nullable(),
  destination: z.string().min(1),
  notes: z.string().optional().nullable()
});

export const analyticsLookupSchema = z.object({
  search: z.string().min(0).optional()
});
