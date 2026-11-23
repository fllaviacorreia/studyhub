import { learningRepository } from "@/server/dal/learning";
import { requireSessionActor } from "@/server/dal/session";
import { QuestionRunner } from "./runner";
export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireSessionActor();
  const session = await learningRepository.getQuestionSession(
    actor.id,
    (await params).id,
  );
  return (
    <QuestionRunner initialSession={JSON.parse(JSON.stringify(session))} />
  );
}
