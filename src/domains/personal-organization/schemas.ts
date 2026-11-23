import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

export const areaStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export const objectiveStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);
export const objectiveTypeSchema = z.enum([
  "PUBLIC_EXAM",
  "CERTIFICATION",
  "ACADEMIC",
  "PROFESSIONAL",
  "PERSONAL",
  "CUSTOM",
]);

export const createStudyAreaSchema = z
  .object({
    name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(120),
    description: optionalText(2000),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal válida.")
      .nullable()
      .optional(),
    icon: optionalText(40),
  })
  .strict();

export const updateStudyAreaSchema = createStudyAreaSchema
  .partial()
  .extend({
    status: areaStatusSchema.optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  );

const targetDate = z.iso.date().nullable().optional();

const objectiveFieldsSchema = z
  .object({
    studyAreaId: z.uuid("Informe uma área válida."),
    title: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(160),
    description: optionalText(4000),
    type: objectiveTypeSchema,
    customTypeName: z.string().trim().min(2).max(80).optional(),
    priority: z.number().int().min(1).max(5),
    status: objectiveStatusSchema.exclude(["ARCHIVED"]).optional(),
    targetDate,
  })
  .strict();

export const createObjectiveSchema = objectiveFieldsSchema.refine(
  (value) => value.type !== "CUSTOM" || value.customTypeName,
  {
    message: "Informe o tipo personalizado.",
    path: ["customTypeName"],
  },
);

export const updateObjectiveSchema = objectiveFieldsSchema
  .partial()
  .extend({
    status: objectiveStatusSchema.optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo.",
  )
  .refine((value) => value.type !== "CUSTOM" || value.customTypeName, {
    message: "Informe o tipo personalizado.",
    path: ["customTypeName"],
  });

export const paginationSchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const areaListSchema = paginationSchema.extend({
  status: areaStatusSchema.optional(),
});
export const objectiveListSchema = paginationSchema.extend({
  areaId: z.uuid().optional(),
  status: objectiveStatusSchema.optional(),
  priority: z.coerce.number().int().min(1).max(5).optional(),
  hasTargetDate: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type CreateStudyAreaInput = z.infer<typeof createStudyAreaSchema>;
export type UpdateStudyAreaInput = z.infer<typeof updateStudyAreaSchema>;
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
