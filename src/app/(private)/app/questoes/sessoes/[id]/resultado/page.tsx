import Link from "next/link";
import { learningRepository } from "@/server/dal/learning";
import { requireSessionActor } from "@/server/dal/session";
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireSessionActor();
  const result = await learningRepository.getResults(
    actor.id,
    (await params).id,
  );
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-teal-700">Resultado final</p>
      <h1 className="mt-2 text-3xl font-bold">
        {result.correctAnswers} de {result.totalQuestions} acertos
      </h1>
      <div className="mt-8 space-y-4">
        {result.attempts.map((attempt, index) => (
          <article
            key={attempt.questionId}
            className="rounded-2xl border bg-white p-5"
          >
            <p
              className={`text-sm font-bold ${attempt.isCorrect ? "text-emerald-700" : "text-rose-700"}`}
            >
              Questão {index + 1} ·{" "}
              {attempt.isCorrect ? "Correta" : "Incorreta"}
            </p>
            <p className="mt-2 font-medium">
              {attempt.questionVersion.statement}
            </p>
            {attempt.questionVersion.explanation && (
              <p className="mt-3 text-sm text-slate-600">
                {attempt.questionVersion.explanation}
              </p>
            )}
          </article>
        ))}
      </div>
      <Link
        className="mt-6 inline-block rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white"
        href="/app/questoes"
      >
        Voltar ao banco
      </Link>
    </div>
  );
}
