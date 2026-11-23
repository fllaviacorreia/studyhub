import { requireSessionActor } from "@/server/dal/session";
import { reviewRepository } from "@/server/dal/reviews";
import { ReviewCenter } from "./review-center";

export default async function ReviewsPage() {
  const actor = await requireSessionActor();
  const [reviews, weakTopics] = await Promise.all([
    reviewRepository.list(actor.id, { limit: 100, status: "ACTIVE" }),
    reviewRepository.weakTopics(actor.id),
  ]);
  return (
    <ReviewCenter
      reviews={reviews.items}
      weakTopics={weakTopics}
      now={new Date().toISOString()}
    />
  );
}
