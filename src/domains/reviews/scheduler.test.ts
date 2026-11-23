import { describe, expect, it } from "vitest";
import { scheduleReview } from "./scheduler";
import { rankWeakTopics } from "./performance";

const state = {
  intervalDays: 10,
  reviewCount: 2,
  lapseCount: 0,
  stability: 10,
  difficulty: 5,
  nextReviewAt: new Date("2026-11-20T12:00:00Z"),
};
describe("repetição espaçada", () => {
  it.each([
    ["AGAIN", 1],
    ["HARD", 13],
    ["GOOD", 21],
    ["EASY", 31],
  ] as const)("agenda %s", (rating, days) => {
    expect(
      scheduleReview(state, rating, new Date("2026-11-22T12:00:00Z"))
        .intervalDays,
    ).toBe(days);
  });
  it("limita intervalos e usa UTC", () => {
    const result = scheduleReview(
      { ...state, intervalDays: 4000 },
      "EASY",
      new Date("2026-01-01T23:30:00-03:00"),
    );
    expect(result.intervalDays).toBe(3650);
    expect(result.nextReviewAt.toISOString()).toBe("2035-12-31T02:30:00.000Z");
  });
});
describe("priorização transparente", () => {
  it("exige amostra mínima e elimina tentativas duplicadas", () => {
    const rows = [1, 2, 3].flatMap((n) => [
      {
        topicId: "t",
        isCorrect: n === 3,
        answeredAt: new Date("2026-11-20"),
        attemptId: String(n),
      },
      {
        topicId: "t",
        isCorrect: false,
        answeredAt: new Date("2026-11-20"),
        attemptId: String(n),
      },
    ]);
    const [topic] = rankWeakTopics(rows, new Date("2026-11-23"));
    expect(topic).toMatchObject({
      attempts: 3,
      errors: 2,
      enoughEvidence: true,
      priorityScore: 66.67,
    });
    expect(rankWeakTopics(rows.slice(0, 2))[0]?.enoughEvidence).toBe(false);
  });
});
