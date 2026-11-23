import { describe, expect, it } from "vitest";
import { correctAnswer, validatePublishedQuestion } from "./correction";

const options = [
  { id: "a", isCorrect: true },
  { id: "b", isCorrect: false },
  { id: "c", isCorrect: true },
];
describe("motor de correção", () => {
  it("corrige escolha simples e verdadeiro/falso", () => {
    expect(
      correctAnswer({ kind: "SINGLE_CHOICE", options: options.slice(0, 2) }, [
        "a",
      ]),
    ).toBe(true);
    expect(
      correctAnswer({ kind: "TRUE_FALSE", options: options.slice(0, 2) }, [
        "b",
      ]),
    ).toBe(false);
  });
  it("exige correspondência exata na múltipla escolha", () => {
    const question = { kind: "MULTIPLE_CHOICE" as const, options };
    expect(correctAnswer(question, ["a", "c"])).toBe(true);
    expect(correctAnswer(question, ["a"])).toBe(false);
    expect(correctAnswer(question, ["a", "b", "c"])).toBe(false);
  });
  it("rejeita respostas e gabaritos inválidos", () => {
    expect(() =>
      correctAnswer({ kind: "SINGLE_CHOICE", options: options.slice(0, 2) }, [
        "x",
      ]),
    ).toThrow("alternativas inválidas");
    expect(() =>
      correctAnswer({ kind: "MULTIPLE_CHOICE", options }, ["a", "a"]),
    ).toThrow("mais de uma vez");
    expect(() =>
      validatePublishedQuestion({ kind: "TRUE_FALSE", options }),
    ).toThrow("gabarito não é válido");
  });
});
