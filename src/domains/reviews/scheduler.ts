export const reviewParameters = {
  minimumIntervalDays: 1,
  maximumIntervalDays: 3650,
  hardMultiplier: 1.2,
  goodMultiplier: 2.0,
  easyMultiplier: 3.0,
  overdueBonusLimit: 0.5,
} as const;

export type ReviewRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type ReviewState = {
  intervalDays: number;
  reviewCount: number;
  lapseCount: number;
  stability: number;
  difficulty: number;
  nextReviewAt: Date;
};

const daysBetween = (later: Date, earlier: Date) =>
  Math.max(0, (later.getTime() - earlier.getTime()) / 86_400_000);

export function scheduleReview(
  state: ReviewState,
  rating: ReviewRating,
  reviewedAt: Date,
  parameters = reviewParameters,
) {
  if (!Number.isFinite(reviewedAt.getTime())) throw new Error("Data inválida.");
  const current = Math.max(parameters.minimumIntervalDays, state.intervalDays);
  const overdueDays = daysBetween(reviewedAt, state.nextReviewAt);
  const overdueBonus = Math.min(
    parameters.overdueBonusLimit,
    overdueDays / Math.max(1, current) / 4,
  );
  const multipliers = {
    HARD: parameters.hardMultiplier,
    GOOD: parameters.goodMultiplier,
    EASY: parameters.easyMultiplier,
  } as const;
  const intervalDays =
    rating === "AGAIN"
      ? parameters.minimumIntervalDays
      : Math.round(current * (multipliers[rating] + overdueBonus));
  const boundedInterval = Math.min(
    parameters.maximumIntervalDays,
    Math.max(parameters.minimumIntervalDays, intervalDays),
  );
  const nextReviewAt = new Date(reviewedAt.getTime());
  nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + boundedInterval);
  return {
    intervalDays: boundedInterval,
    nextReviewAt,
    reviewCount: state.reviewCount + 1,
    lapseCount: state.lapseCount + (rating === "AGAIN" ? 1 : 0),
    stability:
      rating === "AGAIN"
        ? Math.max(0.5, state.stability * 0.6)
        : Math.min(3650, state.stability * multipliers[rating]),
    difficulty: Math.min(
      10,
      Math.max(
        1,
        state.difficulty +
          ({ AGAIN: 1, HARD: 0.35, GOOD: -0.15, EASY: -0.5 } as const)[rating],
      ),
    ),
  };
}
