import { learningRepository } from "@/server/dal/learning";
import { requireSessionActor } from "@/server/dal/session";
export default async function PerformancePage() {
  const actor = await requireSessionActor();
  const data = await learningRepository.performance(actor.id);
  const o = data.overview;
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">Desempenho</p>
      <h1 className="mt-2 text-3xl font-bold">Seus resultados rastreáveis</h1>
      <p className="mt-2 text-slate-600">
        Os indicadores consideram todas as tentativas válidas; questões únicas
        aparecem separadamente.
      </p>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Tentativas", o.totalAttempts],
          ["Questões únicas", o.uniqueQuestions],
          ["Acertos", o.correctAnswers],
          ["Percentual", `${o.accuracyPercentage}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Breakdown title="Por disciplina" rows={data.subjects} />
        <Breakdown title="Por assunto" rows={data.topics} />
      </section>
    </div>
  );
}
function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    id: string;
    name: string;
    total: number;
    correct: number;
    accuracyPercentage: number;
  }>;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id}>
            <div className="flex justify-between text-sm">
              <span>{row.name}</span>
              <b>{row.accuracyPercentage}%</b>
            </div>
            <div className="mt-1 h-2 rounded bg-slate-100">
              <div
                className="h-full rounded bg-teal-600"
                style={{ width: `${row.accuracyPercentage}%` }}
              />
            </div>
          </div>
        ))}
        {!rows.length && (
          <p className="text-sm text-slate-500">
            Responda questões para gerar indicadores.
          </p>
        )}
      </div>
    </div>
  );
}
