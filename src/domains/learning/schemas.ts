import { z } from "zod";

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();
export const pageSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const materialQuerySchema = pageSchema.extend({
  search: z.string().trim().max(120).optional(),
  subjectId: z.uuid().optional(),
  topicId: z.uuid().optional(),
  kind: z
    .enum(["NOTE", "ARTICLE", "BOOK", "VIDEO", "FILE", "LINK", "AI_GENERATED"])
    .optional(),
  progressStatus: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
    .optional(),
});
export const materialInputSchema = z
  .object({
    title: z.string().trim().min(2).max(220),
    summary: nullableText(2000),
    content: z.string().trim().min(1).max(500_000),
    contentFormat: z
      .enum(["MARKDOWN", "STRUCTURED_CONTENT"])
      .default("MARKDOWN"),
    kind: z.enum([
      "NOTE",
      "ARTICLE",
      "BOOK",
      "VIDEO",
      "FILE",
      "LINK",
      "AI_GENERATED",
    ]),
    provenance: z.enum(["OFFICIAL", "AUTHORED", "LICENSED", "AI_GENERATED"]),
    visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).default("PRIVATE"),
    estimatedMinutes: z
      .number()
      .int()
      .positive()
      .max(10000)
      .nullable()
      .optional(),
    license: nullableText(120),
    sourceUrl: z.url().nullable().optional(),
    topicIds: z.array(z.uuid()).min(1).max(30),
    primaryTopicId: z.uuid().nullable().optional(),
    changeDescription: nullableText(2000),
  })
  .strict()
  .refine((v) => !v.primaryTopicId || v.topicIds.includes(v.primaryTopicId), {
    path: ["primaryTopicId"],
    message: "O assunto principal deve estar associado ao material.",
  });
export const materialUpdateSchema = materialInputSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
export const progressInputSchema = z
  .object({
    progressPercentage: z.number().int().min(0).max(100),
    lastPosition: nullableText(500),
    completed: z.boolean().optional(),
  })
  .strict();
const optionSchema = z
  .object({
    label: z.string().trim().min(1).max(10),
    content: z.string().trim().min(1).max(10000),
    isCorrect: z.boolean(),
    order: z.number().int().min(0).max(100),
  })
  .strict();
export const questionInputSchema = z
  .object({
    statement: z.string().trim().min(5).max(100_000),
    kind: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
    provenance: z.enum(["OFFICIAL", "AUTHORED", "LICENSED", "AI_GENERATED"]),
    visibility: z.enum(["PRIVATE", "SHARED", "PUBLIC"]).default("PRIVATE"),
    explanation: nullableText(100_000),
    boardId: z.uuid().nullable().optional(),
    examinationId: z.uuid().nullable().optional(),
    positionId: z.uuid().nullable().optional(),
    year: z.number().int().min(1900).max(2200).nullable().optional(),
    sourceLabel: nullableText(220),
    sourceUrl: z.url().nullable().optional(),
    copyrightNote: nullableText(5000),
    topicIds: z.array(z.uuid()).min(1).max(30),
    primaryTopicId: z.uuid().nullable().optional(),
    options: z.array(optionSchema).min(2).max(20),
  })
  .strict();
export const questionUpdateSchema = questionInputSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
export const questionQuerySchema = pageSchema.extend({
  subjectId: z.uuid().optional(),
  topicId: z.uuid().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  boardId: z.uuid().optional(),
  year: z.coerce.number().int().optional(),
  provenance: z
    .enum(["OFFICIAL", "AUTHORED", "LICENSED", "AI_GENERATED"])
    .optional(),
});
export const exerciseListInputSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    description: nullableText(4000),
    mode: z.enum(["PRACTICE", "EXAM"]),
    questionIds: z.array(z.uuid()).min(1).max(200),
  })
  .strict();
export const exerciseListUpdateSchema = exerciseListInputSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Informe ao menos um campo.");
export const startQuestionSessionSchema = z
  .object({
    exerciseListId: z.uuid(),
    studyTaskId: z.uuid().nullable().optional(),
    studySessionId: z.uuid().nullable().optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();
export const answerSchema = z
  .object({
    questionId: z.uuid(),
    selectedOptionIds: z.array(z.uuid()).min(1).max(20),
    responseTimeSeconds: z
      .number()
      .int()
      .nonnegative()
      .max(86400)
      .nullable()
      .optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();

export type MaterialInput = z.infer<typeof materialInputSchema>;
export type MaterialUpdateInput = z.infer<typeof materialUpdateSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
