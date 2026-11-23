import { z } from "zod";

export const planStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);
export const planningStrategySchema = z.enum([
  "BALANCED",
  "PRIORITY_BASED",
  "DEADLINE_BASED",
]);
const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const planFieldsSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: nullableText(4000),
    status: planStatusSchema.default("DRAFT"),
    startDate: z.iso.date(),
    endDate: z.iso.date().nullable().optional(),
    dailyTargetMinutes: z
      .number()
      .int()
      .positive()
      .max(1440)
      .nullable()
      .optional(),
    weeklyTargetMinutes: z
      .number()
      .int()
      .positive()
      .max(10080)
      .nullable()
      .optional(),
    planningStrategy: planningStrategySchema.default("BALANCED"),
    timezone: z.string().trim().min(1).max(80).default("America/Bahia"),
  })
  .strict();
export const createPlanSchema = planFieldsSchema.refine(
  (value) => !value.endDate || value.endDate >= value.startDate,
  { path: ["endDate"], message: "A data final deve ser posterior à inicial." },
);
export const updatePlanSchema = planFieldsSchema
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  )
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.endDate >= value.startDate,
    {
      path: ["endDate"],
      message: "A data final deve ser posterior à inicial.",
    },
  );
export const planListSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: planStatusSchema.optional(),
});
export const addGoalSchema = z
  .object({
    studyGoalId: z.uuid(),
    priorityWeight: z.number().positive().max(1000),
  })
  .strict();
export const availabilitySchema = z
  .object({
    intervals: z
      .array(
        z
          .object({
            weekday: z.number().int().min(0).max(6),
            startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            isEnabled: z.boolean().default(true),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export const previewApplySchema = z
  .object({ previewId: z.uuid(), version: z.number().int().positive() })
  .strict();
export const generatePreviewSchema = z
  .object({ expectedVersion: z.number().int().positive() })
  .strict();
export const taskStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
  "CANCELLED",
]);
const taskObjectSchema = z
  .object({
    studyPlanId: z.uuid(),
    studyPlanTopicId: z.uuid().nullable().optional(),
    reviewScheduleId: z.uuid().nullable().optional(),
    mockExamId: z.uuid().nullable().optional(),
    title: z.string().trim().min(2).max(200),
    description: nullableText(4000),
    activityType: z
      .enum(["THEORY", "PRACTICE", "REVIEW", "SIMULATION", "CUSTOM"])
      .default("CUSTOM"),
    scheduledDate: z.iso.date(),
    plannedStartAt: z.iso.datetime({ offset: true }),
    plannedEndAt: z.iso.datetime({ offset: true }).nullable().optional(),
    estimatedMinutes: z.number().int().positive().max(1440),
    isLocked: z.boolean().default(false),
  })
  .strict();
export const taskSchema = taskObjectSchema
  .refine(
    (value) => !value.reviewScheduleId || value.activityType === "REVIEW",
    {
      path: ["reviewScheduleId"],
      message: "A revisão exige uma atividade REVIEW.",
    },
  )
  .refine((value) => !value.mockExamId || value.activityType === "SIMULATION", {
    path: ["mockExamId"],
    message: "O simulado exige uma atividade SIMULATION.",
  });
export const updateTaskSchema = taskObjectSchema
  .omit({ studyPlanId: true })
  .partial()
  .extend({ status: taskStatusSchema.optional() })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );
export const taskListSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  planId: z.uuid().optional(),
  status: taskStatusSchema.optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});
export const createSessionSchema = z
  .object({
    studyTaskId: z.uuid().nullable().optional(),
    studyPlanId: z.uuid().nullable().optional(),
    startedAt: z.iso.datetime({ offset: true }),
    endedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    durationSeconds: z.number().int().nonnegative().nullable().optional(),
    notes: nullableText(10000),
    kind: z
      .enum(["THEORY", "PRACTICE", "REVIEW", "MOCK_EXAM"])
      .default("THEORY"),
  })
  .strict();
export const updateSessionSchema = createSessionSchema
  .omit({ studyTaskId: true, studyPlanId: true, startedAt: true, kind: true })
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );
export const sessionListSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  planId: z.uuid().optional(),
});
export const planTopicSchema = z
  .object({
    topicId: z.uuid().nullable().optional(),
    syllabusItemId: z.uuid().nullable().optional(),
    custom: z
      .object({
        title: z.string().trim().min(2).max(200),
        subject: z.string().trim().min(2).max(160),
      })
      .nullable()
      .optional(),
    estimatedMinutes: z.number().int().positive().max(100000),
    priority: z.number().int().min(1).max(5),
    objectiveIds: z.array(z.uuid()).min(1),
  })
  .strict()
  .refine(
    (value) =>
      Number(Boolean(value.topicId)) +
        Number(Boolean(value.syllabusItemId)) +
        Number(Boolean(value.custom)) ===
      1,
    { message: "Informe exatamente uma referência de assunto." },
  );

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
