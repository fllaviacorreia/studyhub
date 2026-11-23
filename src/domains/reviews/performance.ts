export type TopicEvidence = {
  topicId: string;
  isCorrect: boolean;
  answeredAt: Date;
  attemptId: string;
};

export function rankWeakTopics(
  evidence: TopicEvidence[],
  now = new Date(),
  minimumSample = 3,
) {
  const byAttempt = new Map<string, TopicEvidence>();
  for (const item of evidence)
    if (!byAttempt.has(item.attemptId)) byAttempt.set(item.attemptId, item);
  const unique = [...byAttempt.values()];
  const groups = Map.groupBy(unique, (item) => item.topicId);
  return [...groups]
    .map(([topicId, rows]) => {
      const attempts = rows.length;
      const errors = rows.filter((row) => !row.isCorrect).length;
      const accuracy = attempts ? (attempts - errors) / attempts : null;
      const enoughEvidence = attempts >= minimumSample;
      const recentErrors = rows.filter(
        (row) =>
          !row.isCorrect &&
          now.getTime() - row.answeredAt.getTime() <= 30 * 86_400_000,
      ).length;
      const priorityScore = enoughEvidence
        ? Math.round(
            ((1 - (accuracy ?? 1)) * 70 + Math.min(30, recentErrors * 10)) *
              100,
          ) / 100
        : null;
      return {
        topicId,
        attempts,
        errors,
        accuracyPercentage:
          accuracy == null ? null : Math.round(accuracy * 10_000) / 100,
        enoughEvidence,
        priorityScore,
        explanation: enoughEvidence
          ? `${errors} erro(s) em ${attempts} tentativa(s), ${recentErrors} nos últimos 30 dias.`
          : `Amostra insuficiente: ${attempts} de ${minimumSample} tentativas mínimas.`,
      };
    })
    .sort((a, b) => (b.priorityScore ?? -1) - (a.priorityScore ?? -1));
}
