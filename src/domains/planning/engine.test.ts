import { describe, expect, it } from "vitest";
import { generateSchedule } from "./engine";

const base = {
  startDate: "2026-11-23",
  endDate: "2026-11-24",
  timezone: "America/Bahia",
  strategy: "BALANCED" as const,
  objectives: [{ id: "a", priorityWeight: 1 }],
  availability: [
    { weekday: 1, startMinute: 480, endMinute: 540 },
    { weekday: 2, startMinute: 480, endMinute: 540 },
  ],
};
describe("motor de planejamento", () => {
  it("respeita capacidade e informa carga não alocada", () => {
    const result = generateSchedule({
      ...base,
      topics: [
        {
          id: "t",
          title: "T",
          estimatedMinutes: 150,
          priority: 3,
          objectiveIds: ["a"],
        },
      ],
    });
    expect(result.capacityMinutes).toBe(120);
    expect(result.missingMinutes).toBe(30);
    expect(
      result.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    ).toBe(120);
  });
  it("deduplica assunto compartilhado e é determinístico", () => {
    const input = {
      ...base,
      objectives: [
        { id: "a", priorityWeight: 1 },
        { id: "b", priorityWeight: 1 },
      ],
      topics: [
        {
          id: "shared",
          title: "Compartilhado",
          estimatedMinutes: 60,
          priority: 3,
          objectiveIds: ["a", "b"],
        },
      ],
    };
    expect(generateSchedule(input)).toEqual(generateSchedule(input));
    expect(generateSchedule(input).tasks).toHaveLength(1);
  });
  it("preserva uma atividade fixa", () => {
    const result = generateSchedule({
      ...base,
      fixedTasks: [
        { id: "fixed", startAt: "2026-11-23T08:00:00Z", estimatedMinutes: 30 },
      ],
      topics: [
        {
          id: "t",
          title: "T",
          estimatedMinutes: 60,
          priority: 3,
          objectiveIds: ["a"],
        },
      ],
    });
    expect(result.tasks[0].startMinute).toBe(510);
  });
});
