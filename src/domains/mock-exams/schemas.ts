import { z } from "zod";

const filters = z
  .object({
    topicIds: z.array(z.uuid()).max(50).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    boardId: z.uuid().optional(),
    yearFrom: z.number().int().min(1900).max(2200).optional(),
    yearTo: z.number().int().min(1900).max(2200).optional(),
  })
  .strict();
const section = z
  .object({
    subjectId: z.uuid().nullable().optional(),
    title: z.string().trim().min(1).max(160),
    questionCount: z.number().int().min(1).max(200),
    weight: z.number().positive().max(100).default(1),
    order: z.number().int().min(0).max(100),
    filters: filters.optional(),
  })
  .strict();
export const mockExamInputSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(4000).nullable().optional(),
    studyGoalId: z.uuid().nullable().optional(),
    examinationId: z.uuid().nullable().optional(),
    positionId: z.uuid().nullable().optional(),
    durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
    totalQuestions: z.number().int().min(1).max(500),
    scoringStrategy: z
      .enum(["SIMPLE", "WEIGHTED_BY_SECTION"])
      .default("SIMPLE"),
    selectionSeed: z.string().trim().min(1).max(120),
    filters: filters.default({}),
    sections: z.array(section).min(1).max(30),
  })
  .strict()
  .refine(
    (value) =>
      value.sections.reduce((sum, item) => sum + item.questionCount, 0) ===
      value.totalQuestions,
    {
      path: ["sections"],
      message: "A soma das seções deve ser igual ao total de questões.",
    },
  );
export const mockExamUpdateSchema = mockExamInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);
export const mockExamQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "READY", "ARCHIVED"]).optional(),
});
export const startMockExamSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(120),
    studyTaskId: z.uuid().nullable().optional(),
    studySessionId: z.uuid().nullable().optional(),
  })
  .strict();
export const mockAnswerSchema = z
  .object({
    questionId: z.uuid(),
    selectedOptionIds: z.array(z.uuid()).min(1).max(20),
    responseTimeSeconds: z.number().int().min(0).max(86400).optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();
