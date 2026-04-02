import { OdometerEntryType } from "@prisma/client";
import { z } from "zod";

export const odometerEntrySchema = z.object({
  reservationId: z.string().optional().nullable(),
  type: z.nativeEnum(OdometerEntryType),
  valueKm: z.number().int().nonnegative(),
  locationId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  occurredAt: z.string().datetime()
});
