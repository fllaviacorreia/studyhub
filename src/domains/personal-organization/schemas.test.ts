import { describe, expect, it } from "vitest";

import {
  createObjectiveSchema,
  createStudyAreaSchema,
  objectiveListSchema,
  updateStudyAreaSchema,
} from "./schemas";

describe("personal organization schemas", () => {
  it("validates and normalizes area data without accepting identity", () => {
    const result = createStudyAreaSchema.safeParse({
      name: "  Direito  ",
      color: "#0f766e",
      userId: "forged",
    });
    expect(result.success).toBe(false);
    expect(createStudyAreaSchema.parse({ name: "  Direito  " }).name).toBe(
      "Direito",
    );
  });

  it("rejects invalid colors and empty patches", () => {
    expect(
      createStudyAreaSchema.safeParse({ name: "Área", color: "red" }).success,
    ).toBe(false);
    expect(updateStudyAreaSchema.safeParse({}).success).toBe(false);
  });

  it("validates goals, dates, priorities and custom types", () => {
    const base = {
      studyAreaId: "c7c10b6a-8c51-4af2-b72a-96757cebe9ee",
      title: "Concluir curso",
      type: "PERSONAL",
      priority: 3,
    };
    expect(createObjectiveSchema.safeParse(base).success).toBe(true);
    expect(
      createObjectiveSchema.safeParse({ ...base, priority: 6 }).success,
    ).toBe(false);
    expect(
      createObjectiveSchema.safeParse({ ...base, type: "CUSTOM" }).success,
    ).toBe(false);
    expect(
      createObjectiveSchema.safeParse({ ...base, targetDate: "21/11/2026" })
        .success,
    ).toBe(false);
  });

  it("parses filters and enforces pagination limits", () => {
    expect(
      objectiveListSchema.parse({
        limit: "10",
        priority: "5",
        hasTargetDate: "true",
      }),
    ).toMatchObject({ limit: 10, priority: 5, hasTargetDate: true });
    expect(objectiveListSchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});
