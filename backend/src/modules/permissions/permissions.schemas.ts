import { z } from "zod";

export const replaceUserPermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      permissionId: z.string(),
      scope: z.string().min(1)
    })
  )
});
