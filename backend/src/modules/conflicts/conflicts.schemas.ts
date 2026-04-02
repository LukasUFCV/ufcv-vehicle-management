import { z } from "zod";

export const conflictsListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  vehicleId: z.string().optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional()
});

export const resolveConflictSchema = z.object({
  resolution: z.enum(["MARK_RESOLVED", "CANCEL_PRIMARY", "CANCEL_SECONDARY"]),
  notes: z.string().optional().nullable()
});
