import { describe, expect, it } from "vitest";
import { generatedQuestionsSchema, sendMessageSchema } from "./schemas";

describe("schemas do tutor", () => {
  it("limita mensagens excessivas", () => {
    expect(() =>
      sendMessageSchema.parse({ content: "x".repeat(8_001) }),
    ).toThrow();
  });

  it("rejeita gabarito que não pertence às alternativas", () => {
    expect(() =>
      generatedQuestionsSchema.parse({
        questions: [
          {
            statement: "Pergunta",
            kind: "SINGLE_CHOICE",
            difficulty: "MEDIUM",
            options: [
              { id: "A", text: "Um" },
              { id: "B", text: "Dois" },
            ],
            correctOptionIds: ["C"],
            explanation: "Explicação",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejeita alternativas duplicadas", () => {
    expect(() =>
      generatedQuestionsSchema.parse({
        questions: [
          {
            statement: "Pergunta",
            kind: "SINGLE_CHOICE",
            difficulty: "MEDIUM",
            options: [
              { id: "A", text: "Igual" },
              { id: "B", text: "igual" },
            ],
            correctOptionIds: ["A"],
            explanation: "Explicação",
          },
        ],
      }),
    ).toThrow();
  });
});
