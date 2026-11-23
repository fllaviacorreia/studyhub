import { requireSessionActor } from "@/server/dal/session";
import { reviewRepository } from "@/server/dal/reviews";
import { ErrorNotebook } from "./error-notebook";
export default async function ErrorNotebookPage() {
  const actor = await requireSessionActor();
  const entries = await reviewRepository.listNotebook(actor.id, { limit: 100 });
  return <ErrorNotebook entries={entries.items} />;
}
