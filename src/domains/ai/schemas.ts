import { z } from "zod";

const uuid = z.string().uuid();
export const aiLimits = {
  messageCharacters: 8_000,
  titleCharacters: 160,
  pageSize: 30,
} as const;

export const conversationQuerySchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  cursor: uuid.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export const createConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(aiLimits.titleCharacters)
    .default("Nova conversa"),
  studyGoalId: uuid.nullish(),
  studyPlanId: uuid.nullish(),
});
export const updateConversationSchema = createConversationSchema
  .partial()
  .extend({
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  });
export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(aiLimits.messageCharacters),
});
export const generationSchema = z.object({
  materialIds: z.array(uuid).min(1).max(5),
  topicIds: z.array(uuid).max(10).default([]),
  instructions: z.string().trim().max(2_000).optional(),
  depth: z
    .enum(["INTRODUCTORY", "INTERMEDIATE", "ADVANCED"])
    .default("INTERMEDIATE"),
  questionCount: z.number().int().min(1).max(10).default(5),
});
export const recommendationSchema = z.object({
  studyGoalId: uuid.nullish(),
  studyPlanId: uuid.nullish(),
});

export const generatedQuestionsSchema = z.object({
  questions: z
    .array(
      z
        .object({
          statement: z.string().min(1),
          kind: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]),
          difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
          options: z
            .array(z.object({ id: z.string().min(1), text: z.string().min(1) }))
            .min(2),
          correctOptionIds: z.array(z.string().min(1)).min(1),
          explanation: z.string().min(1),
        })
        .superRefine((question, context) => {
          const ids = question.options.map((option) => option.id);
          if (
            new Set(ids).size !== ids.length ||
            new Set(
              question.options.map((option) =>
                option.text.trim().toLowerCase(),
              ),
            ).size !== question.options.length
          )
            context.addIssue({
              code: "custom",
              message: "Alternativas duplicadas.",
            });
          if (question.correctOptionIds.some((id) => !ids.includes(id)))
            context.addIssue({
              code: "custom",
              message: "Gabarito não corresponde às alternativas.",
            });
          if (
            question.kind !== "MULTIPLE_CHOICE" &&
            question.correctOptionIds.length !== 1
          )
            context.addIssue({
              code: "custom",
              message: "O tipo exige exatamente uma resposta correta.",
            });
        }),
    )
    .min(1),
});
