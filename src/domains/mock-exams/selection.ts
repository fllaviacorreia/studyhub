export type QuestionCandidate = {
  id: string;
  subjectIds: string[];
  topicIds: string[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  boardId: string | null;
  year: number | null;
};

export type SelectionFilter = {
  subjectId?: string;
  topicIds?: string[];
  difficulty?: QuestionCandidate["difficulty"];
  boardId?: string;
  yearFrom?: number;
  yearTo?: number;
};

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function selectQuestions(
  candidates: QuestionCandidate[],
  count: number,
  seed: string,
  filter: SelectionFilter = {},
) {
  const eligible = candidates.filter(
    (question) =>
      (!filter.subjectId || question.subjectIds.includes(filter.subjectId)) &&
      (!filter.topicIds?.length ||
        filter.topicIds.some((id) => question.topicIds.includes(id))) &&
      (!filter.difficulty || question.difficulty === filter.difficulty) &&
      (!filter.boardId || question.boardId === filter.boardId) &&
      (!filter.yearFrom ||
        (question.year != null && question.year >= filter.yearFrom)) &&
      (!filter.yearTo ||
        (question.year != null && question.year <= filter.yearTo)),
  );
  const unique = [...new Map(eligible.map((item) => [item.id, item])).values()];
  if (unique.length < count)
    throw new Error(
      `Há ${unique.length} questão(ões) elegível(is), mas ${count} foram solicitadas.`,
    );
  return unique
    .map((question) => ({ question, order: hash(`${seed}:${question.id}`) }))
    .sort(
      (a, b) => a.order - b.order || a.question.id.localeCompare(b.question.id),
    )
    .slice(0, count)
    .map(({ question }) => question);
}
