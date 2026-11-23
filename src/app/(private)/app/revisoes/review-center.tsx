"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  nextReviewAt: Date | string;
  intervalDays: number;
  reviewCount: number;
  lapseCount: number;
  topic: { name: string; subject: { name: string } };
};
type Weak = {
  topicId: string;
  attempts: number;
  errors: number;
  enoughEvidence: boolean;
  priorityScore: number | null;
  explanation: string;
};
export function ReviewCenter({
  reviews,
  weakTopics,
  now,
}: {
  reviews: Review[];
  weakTopics: Weak[];
  now: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>();
  const nowTimestamp = new Date(now).getTime();
  const complete = async (id: string, rating: string) => {
    setBusy(id);
    await fetch(`/api/v1/reviews/${id}/complete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating, idempotencyKey: crypto.randomUUID() }),
    });
    setBusy(undefined);
    router.refresh();
  };
  const due = reviews.filter(
    (item) => new Date(item.nextReviewAt).getTime() <= nowTimestamp,
  );
  const future = reviews.filter(
    (item) => new Date(item.nextReviewAt).getTime() > nowTimestamp,
  );
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">
        Aprendizagem contínua
      </p>
      <h1 className="mt-2 text-3xl font-bold">Central de revisões</h1>
      <p className="mt-3 text-slate-600">
        Avalie sua recordação explicitamente; o histórico de questões apenas
        orienta prioridades.
      </p>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Metric label="Pendentes" value={due.length} />
        <Metric label="Próximos dias" value={future.length} />
        <Metric
          label="Dificuldades recorrentes"
          value={
            weakTopics.filter(
              (item) => item.enoughEvidence && (item.priorityScore ?? 0) >= 50,
            ).length
          }
        />
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-bold">Para revisar agora</h2>
        <div className="mt-4 space-y-3">
          {due.length ? (
            due.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.topic.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.topic.subject.name} · intervalo atual:{" "}
                      {item.intervalDays} dia(s)
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-2"
                    aria-label="Avaliação da recordação"
                  >
                    {[
                      ["AGAIN", "Errei"],
                      ["HARD", "Difícil"],
                      ["GOOD", "Bom"],
                      ["EASY", "Fácil"],
                    ].map(([value, label]) => (
                      <button
                        disabled={busy === item.id}
                        onClick={() => complete(item.id, value)}
                        key={value}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-teal-50 disabled:opacity-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <Empty text="Nenhuma revisão vencida." />
          )}
        </div>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">Próximas revisões</h2>
          <div className="mt-4 space-y-3">
            {future.slice(0, 10).map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="font-semibold">{item.topic.name}</p>
                <p className="text-sm text-slate-500">
                  {new Date(item.nextReviewAt).toLocaleString("pt-BR")}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Assuntos prioritários</h2>
          <div className="mt-4 space-y-3">
            {weakTopics.slice(0, 10).map((item) => (
              <article
                key={item.topicId}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="font-semibold">
                  {item.enoughEvidence
                    ? `Prioridade ${item.priorityScore}`
                    : "Sem classificação"}
                </p>
                <p className="text-sm text-slate-600">{item.explanation}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
      {text}
    </p>
  );
}
