import { learningRepository } from "@/server/dal/learning";
import { requireSessionActor } from "@/server/dal/session";
import { QuestionBank } from "./question-bank";
export default async function QuestionsPage() {
  const actor = await requireSessionActor();
  const [questions, lists] = await Promise.all([
    learningRepository.listQuestions(actor, { limit: 100 }),
    learningRepository.listExerciseLists(actor.id, { limit: 20 }),
  ]);
  return (
    <QuestionBank
      questions={questions.data}
      lists={lists.data.map((l) => ({
        id: l.id,
        title: l.title,
        mode: l.mode,
        count: l._count.questions,
      }))}
    />
  );
}
