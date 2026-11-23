export type ScoredAnswer = { sectionId: string; isCorrect: boolean };
export type ScoredSection = {
  id: string;
  weight: number;
  questionCount: number;
};

export function scoreMockExam(
  answers: ScoredAnswer[],
  sections: ScoredSection[],
  strategy: "SIMPLE" | "WEIGHTED_BY_SECTION",
) {
  const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.questionCount,
    0,
  );
  const rawScore = totalQuestions ? (correctAnswers / totalQuestions) * 100 : 0;
  const bySection = sections.map((section) => {
    const sectionAnswers = answers.filter(
      (answer) => answer.sectionId === section.id,
    );
    const correct = sectionAnswers.filter((answer) => answer.isCorrect).length;
    return {
      sectionId: section.id,
      correct,
      total: section.questionCount,
      weight: section.weight,
      percentage: section.questionCount
        ? (correct / section.questionCount) * 100
        : 0,
    };
  });
  const totalWeight = sections.reduce(
    (sum, section) => sum + section.weight,
    0,
  );
  const weightedScore =
    strategy === "WEIGHTED_BY_SECTION" && totalWeight
      ? bySection.reduce(
          (sum, section) => sum + section.percentage * section.weight,
          0,
        ) / totalWeight
      : rawScore;
  return {
    correctAnswers,
    totalQuestions,
    rawScore: Math.round(rawScore * 100) / 100,
    weightedScore: Math.round(weightedScore * 100) / 100,
    bySection,
  };
}
