import { requireSessionActor } from "@/server/dal/session";
import { mockExamRepository } from "@/server/dal/mock-exams";
export default async function MockResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireSessionActor();
  const result = (await mockExamRepository.results(
    actor.id,
    (await params).id,
  )) as unknown as {
    resultSnapshot: {
      rawScore: number;
      weightedScore: number;
      correctAnswers: number;
      totalQuestions: number;
      unanswered: number;
      timeUsedSeconds: number;
      bySubject: Array<{
        id: string;
        name: string;
        correct: number;
        total: number;
      }>;
    };
    answers: {
      attempts: Array<{
        questionId: string;
        isCorrect: boolean;
        selectedOptionIds: string[];
        correctOptionIds: string[];
        questionVersion: { statement: string; explanation: string | null };
      }>;
    };
  };
  const summary = result.resultSnapshot;
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-teal-700">Resultado final</p>
      <h1 className="mt-2 text-3xl font-bold">Desempenho no simulado</h1>
      <section className="mt-8 grid gap-4 sm:grid-cols-4">
        <Metric label="Nota" value={`${summary.weightedScore}%`} />
        <Metric
          label="Acertos"
          value={`${summary.correctAnswers}/${summary.totalQuestions}`}
        />
        <Metric label="Em branco" value={String(summary.unanswered)} />
        <Metric
          label="Tempo"
          value={`${Math.round(summary.timeUsedSeconds / 60)} min`}
        />
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-bold">Por disciplina</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {summary.bySubject.map((item) => (
            <article key={item.id} className="rounded-xl border bg-white p-4">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-600">
                {item.correct} de {item.total} corretas
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-bold">Gabarito comentado</h2>
        <div className="mt-4 space-y-3">
          {result.answers.attempts.map((answer) => (
            <article
              key={answer.questionId}
              className="rounded-xl border bg-white p-5"
            >
              <p className="font-semibold">
                {answer.questionVersion.statement}
              </p>
              <p
                className={`mt-2 text-sm font-bold ${answer.isCorrect ? "text-emerald-700" : "text-red-700"}`}
              >
                {answer.isCorrect ? "Correta" : "Incorreta"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {answer.questionVersion.explanation ??
                  "Sem comentário editorial."}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
}
