import { CommentVisibility } from "@prisma/client";
import { z } from "zod";

export const vehicleCommentSchema = z.object({
  body: z.string().min(1),
  visibility: z.nativeEnum(CommentVisibility).default(CommentVisibility.PRIVATE)
});

export const reviewCommentRequestSchema = z.object({
  approve: z.boolean(),
  reviewComment: z.string().optional().nullable()
});
