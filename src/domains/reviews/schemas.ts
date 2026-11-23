import { z } from "zod";

export const reviewQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  subjectId: z.uuid().optional(),
  topicId: z.uuid().optional(),
  days: z.coerce.number().int().min(0).max(365).optional(),
});
export const createReviewSchema = z
  .object({ topicId: z.uuid(), firstReviewAt: z.iso.datetime().optional() })
  .strict();
export const updateReviewSchema = z
  .object({ status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]) })
  .strict();
export const completeReviewSchema = z
  .object({
    rating: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
    responseTimeSeconds: z.number().int().min(0).max(86400).optional(),
    notes: z.string().trim().max(5000).optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();
export const notebookQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "ARCHIVED"]).optional(),
  subjectId: z.uuid().optional(),
  topicId: z.uuid().optional(),
  boardId: z.uuid().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});
export const updateNotebookSchema = z
  .object({
    status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "ARCHIVED"]).optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);
