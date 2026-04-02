import { VehicleStatus } from "@prisma/client";
import { z } from "zod";

export const vehiclesListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  locationId: z.string().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
});

export const vehicleInputSchema = z.object({
  registrationNumber: z.string().min(2),
  internalName: z.string().optional().nullable(),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  availabilityLabel: z.string().default("Disponible"),
  currentLocationId: z.string().optional().nullable(),
  attachmentKey: z.string().optional().nullable(),
  type: z.string().min(1),
  primaryImagePath: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  inServiceAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true)
});
