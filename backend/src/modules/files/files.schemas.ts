import { z } from "zod";

export const filesListQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1)
});
