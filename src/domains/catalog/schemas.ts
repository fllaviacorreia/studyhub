import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();
const url = z.url().max(2000).nullable().optional();
const uuid = z.uuid();
export const catalogStatusSchema = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "ARCHIVED",
]);
export const examinationStatusSchema = z.enum([
  "PLANNED",
  "AUTHORIZED",
  "BOARD_DEFINED",
  "NOTICE_PUBLISHED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "EXAM_SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export const documentTypeSchema = z.enum([
  "OPENING",
  "AMENDMENT",
  "RECTIFICATION",
  "ANNOUNCEMENT",
  "OTHER",
]);
export const paginationSchema = z.object({
  cursor: uuid.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const organizationInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    acronym: optionalText(30),
    description: optionalText(4000),
    website: url,
    parentOrganizationId: uuid.nullable().optional(),
    country: z.string().trim().length(2).toUpperCase().default("BR"),
  })
  .strict();
export const organizationUpdateSchema = organizationInputSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );
export const examBoardInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    acronym: optionalText(30),
    website: url,
  })
  .strict();
export const examinationInputSchema = z
  .object({
    organizationId: uuid,
    examBoardId: uuid.nullable().optional(),
    title: z.string().trim().min(2).max(180),
    description: optionalText(6000),
    year: z.number().int().min(1900).max(2200).nullable().optional(),
    status: examinationStatusSchema.default("PLANNED"),
    publicationStatus: catalogStatusSchema.default("DRAFT"),
    registrationStartAt: z.iso.datetime().nullable().optional(),
    registrationEndAt: z.iso.datetime().nullable().optional(),
    examDate: z.iso.datetime().nullable().optional(),
    officialUrl: url,
    sourceReference: optionalText(4000),
  })
  .strict()
  .refine(
    (value) =>
      !value.registrationStartAt ||
      !value.registrationEndAt ||
      value.registrationStartAt <= value.registrationEndAt,
    {
      path: ["registrationEndAt"],
      message: "O fim das inscrições deve ser posterior ao início.",
    },
  );
export const examinationUpdateSchema = z
  .object({
    organizationId: uuid.optional(),
    examBoardId: uuid.nullable().optional(),
    title: z.string().trim().min(2).max(180).optional(),
    description: optionalText(6000),
    year: z.number().int().min(1900).max(2200).nullable().optional(),
    status: examinationStatusSchema.optional(),
    publicationStatus: catalogStatusSchema.optional(),
    registrationStartAt: z.iso.datetime().nullable().optional(),
    registrationEndAt: z.iso.datetime().nullable().optional(),
    examDate: z.iso.datetime().nullable().optional(),
    officialUrl: url,
    sourceReference: optionalText(4000),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );
export const positionInputSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    description: optionalText(4000),
    educationLevel: optionalText(120),
    requirements: optionalText(6000),
    vacancies: z.number().int().nonnegative().nullable().optional(),
    specializations: z
      .array(
        z
          .object({
            name: z.string().trim().min(2).max(160),
            description: optionalText(2000),
            vacancies: z.number().int().nonnegative().nullable().optional(),
          })
          .strict(),
      )
      .max(100)
      .default([]),
  })
  .strict();
export const noticeInputSchema = z
  .object({
    title: z.string().trim().min(2).max(200),
    noticeNumber: optionalText(80),
    documentType: documentTypeSchema,
    publicationDate: z.iso.datetime().nullable().optional(),
    officialUrl: url,
    filePath: optionalText(2000),
    sourceReference: optionalText(4000),
    originalNoticeId: uuid.nullable().optional(),
    status: catalogStatusSchema.default("DRAFT"),
  })
  .strict();
export const noticeVersionInputSchema = z
  .object({
    versionNumber: z.number().int().positive(),
    documentUrl: url,
    contentHash: optionalText(128),
    publishedAt: z.iso.datetime().nullable().optional(),
    changeDescription: optionalText(4000),
    status: catalogStatusSchema.default("DRAFT"),
  })
  .strict();
export const subjectInputSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: optionalText(4000),
    status: catalogStatusSchema.default("DRAFT"),
  })
  .strict();
export const topicInputSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    description: optionalText(4000),
    parentTopicId: uuid.nullable().optional(),
    position: z.number().int().nonnegative().default(0),
  })
  .strict();
export type SyllabusItemInput = {
  title: string;
  description?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  order: number;
  weight?: number | null;
  numberOfQuestions?: number | null;
  children: SyllabusItemInput[];
};
const syllabusItemSchema: z.ZodType<SyllabusItemInput> = z.lazy(() =>
  z
    .object({
      title: z.string().trim().min(1).max(300),
      description: optionalText(4000),
      subjectId: uuid.nullable().optional(),
      topicId: uuid.nullable().optional(),
      order: z.number().int().nonnegative(),
      weight: z.number().nonnegative().nullable().optional(),
      numberOfQuestions: z.number().int().nonnegative().nullable().optional(),
      children: z.array(syllabusItemSchema).max(300).default([]),
    })
    .strict(),
);
export const syllabusInputSchema = z
  .object({
    noticeId: uuid.nullable().optional(),
    positionId: uuid.nullable().optional(),
    specializationId: uuid.nullable().optional(),
    title: z.string().trim().min(2).max(200),
    status: catalogStatusSchema.default("DRAFT"),
    items: z.array(syllabusItemSchema).max(500).default([]),
  })
  .strict();
export const examinationListSchema = paginationSchema.extend({
  search: z.string().trim().max(160).optional(),
  organizationId: uuid.optional(),
  examBoardId: uuid.optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  status: examinationStatusSchema.optional(),
});
export const catalogSearchSchema = paginationSchema.extend({
  search: z.string().trim().max(160).optional(),
});
export const objectiveCatalogLinkSchema = z
  .object({
    examinationId: uuid.nullable(),
    selections: z
      .array(
        z
          .object({
            positionId: uuid,
            specializationId: uuid.nullable().optional(),
          })
          .strict(),
      )
      .max(100)
      .default([]),
  })
  .strict()
  .refine(
    (value) => value.examinationId !== null || value.selections.length === 0,
    "Não selecione cargos sem um concurso.",
  );

export type OrganizationInput = z.infer<typeof organizationInputSchema>;
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
export type ExamBoardInput = z.infer<typeof examBoardInputSchema>;
export type ExaminationInput = z.infer<typeof examinationInputSchema>;
export type ExaminationUpdateInput = z.infer<typeof examinationUpdateSchema>;
export type PositionInput = z.infer<typeof positionInputSchema>;
export type NoticeInput = z.infer<typeof noticeInputSchema>;
export type NoticeVersionInput = z.infer<typeof noticeVersionInputSchema>;
export type SubjectInput = z.infer<typeof subjectInputSchema>;
export type TopicInput = z.infer<typeof topicInputSchema>;
export type SyllabusInput = z.infer<typeof syllabusInputSchema>;
export type ObjectiveCatalogLinkInput = z.infer<
  typeof objectiveCatalogLinkSchema
>;
