import { describe, expect, it } from "vitest";
import {
  availabilitySchema,
  createPlanSchema,
  planTopicSchema,
} from "./schemas";
describe("schemas de planejamento", () => {
  it("rejeita período invertido", () =>
    expect(
      createPlanSchema.safeParse({
        title: "Plano",
        startDate: "2026-11-24",
        endDate: "2026-11-23",
      }).success,
    ).toBe(false));
  it("aceita múltiplos intervalos no dia", () =>
    expect(
      availabilitySchema.safeParse({
        intervals: [
          { weekday: 1, startTime: "08:00", endTime: "09:00", isEnabled: true },
          { weekday: 1, startTime: "10:00", endTime: "11:00", isEnabled: true },
        ],
      }).success,
    ).toBe(true));
  it("exige referência estruturada única", () =>
    expect(
      planTopicSchema.safeParse({
        topicId: crypto.randomUUID(),
        custom: { title: "Manual", subject: "Direito" },
        estimatedMinutes: 60,
        priority: 3,
        objectiveIds: [crypto.randomUUID()],
      }).success,
    ).toBe(false));
});
