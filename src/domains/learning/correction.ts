import { LearningError } from "./errors";

export type CorrectableQuestion = {
  kind: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options: ReadonlyArray<{ id: string; isCorrect: boolean }>;
};

export function validatePublishedQuestion(question: CorrectableQuestion) {
  const correct = question.options.filter((option) => option.isCorrect).length;
  if (question.options.length < 2)
    throw new LearningError(
      "INVALID_DEPENDENCY",
      "A questão deve possuir ao menos duas alternativas.",
    );
  if (
    (question.kind === "SINGLE_CHOICE" && correct !== 1) ||
    (question.kind === "TRUE_FALSE" &&
      (question.options.length !== 2 || correct !== 1)) ||
    (question.kind === "MULTIPLE_CHOICE" && correct < 1)
  )
    throw new LearningError(
      "INVALID_DEPENDENCY",
      "O gabarito não é válido para o tipo da questão.",
    );
}

export function correctAnswer(
  question: CorrectableQuestion,
  selectedOptionIds: readonly string[],
) {
  const selected = new Set(selectedOptionIds);
  if (selected.size !== selectedOptionIds.length)
    throw new LearningError(
      "INVALID_ANSWER",
      "Uma alternativa não pode ser selecionada mais de uma vez.",
    );
  if (
    selected.size === 0 ||
    [...selected].some(
      (id) => !question.options.some((option) => option.id === id),
    )
  )
    throw new LearningError(
      "INVALID_ANSWER",
      "A resposta contém alternativas inválidas.",
    );
  if (question.kind !== "MULTIPLE_CHOICE" && selected.size !== 1)
    throw new LearningError(
      "INVALID_ANSWER",
      "Selecione exatamente uma alternativa.",
    );
  const correct = new Set(
    question.options.filter((option) => option.isCorrect).map(({ id }) => id),
  );
  return (
    selected.size === correct.size &&
    [...selected].every((id) => correct.has(id))
  );
}
