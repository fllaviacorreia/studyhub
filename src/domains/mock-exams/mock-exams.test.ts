import { describe, expect, it } from "vitest";
import { selectQuestions } from "./selection";
import { scoreMockExam } from "./scoring";

describe("montagem de simulados", () => {
  const candidates = ["a", "b", "c"].map((id) => ({
    id,
    subjectIds: ["s"],
    topicIds: ["t"],
    difficulty: "MEDIUM" as const,
    boardId: null,
    year: 2026,
  }));
  it("é reproduzível e não duplica", () =>
    expect(selectQuestions(candidates, 2, "seed")).toEqual(
      selectQuestions(candidates, 2, "seed"),
    ));
  it("não amplia filtros quando faltam questões", () =>
    expect(() => selectQuestions(candidates, 4, "seed")).toThrow("3 questão"));
});
describe("pontuação", () => {
  it("calcula nota simples e ponderada", () => {
    const sections = [
      { id: "a", weight: 1, questionCount: 2 },
      { id: "b", weight: 3, questionCount: 2 },
    ];
    const answers = [
      { sectionId: "a", isCorrect: true },
      { sectionId: "a", isCorrect: true },
      { sectionId: "b", isCorrect: true },
      { sectionId: "b", isCorrect: false },
    ];
    expect(scoreMockExam(answers, sections, "SIMPLE")).toMatchObject({
      rawScore: 75,
      weightedScore: 75,
    });
    expect(
      scoreMockExam(answers, sections, "WEIGHTED_BY_SECTION"),
    ).toMatchObject({ weightedScore: 62.5 });
  });
});
