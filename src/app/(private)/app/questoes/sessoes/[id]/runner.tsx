"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Option = { id: string; label: string; content: string };
type Item = {
  questionId: string;
  position: number;
  questionVersion: { kind: string; statement: string; options: Option[] };
};
type Session = {
  id: string;
  mode: string;
  status: string;
  items: Item[];
  attempts: Array<{ questionId: string }>;
};
export function QuestionRunner({
  initialSession,
}: {
  initialSession: Session;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const item = session.items[index];
  async function answer() {
    const response = await fetch(
      `/api/v1/question-sessions/${session.id}/answers`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          questionId: item.questionId,
          selectedOptionIds: selected,
          idempotencyKey: crypto.randomUUID(),
        }),
      },
    );
    const payload = await response.json();
    if (response.ok) {
      setFeedback(
        session.mode === "PRACTICE"
          ? payload.data.isCorrect
            ? "Resposta correta."
            : "Resposta incorreta."
          : "Resposta registrada.",
      );
      setSession((s) => ({
        ...s,
        attempts: [...s.attempts, { questionId: item.questionId }],
      }));
    } else setFeedback(payload.detail);
  }
  async function finish() {
    const response = await fetch(
      `/api/v1/question-sessions/${session.id}/finish`,
      { method: "POST" },
    );
    if (response.ok)
      router.push(`/app/questoes/sessoes/${session.id}/resultado`);
  }
  if (!item) return <p>Sessão sem questões.</p>;
  const multiple = item.questionVersion.kind === "MULTIPLE_CHOICE";
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-teal-700">
        {session.mode === "EXAM" ? "Simulado" : "Prática"} · Questão {index + 1}{" "}
        de {session.items.length}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded bg-slate-200">
        <div
          className="h-full bg-teal-600"
          style={{ width: `${((index + 1) / session.items.length) * 100}%` }}
        />
      </div>
      <section className="mt-6 rounded-2xl border bg-white p-6">
        <h1 className="text-lg font-semibold leading-8">
          {item.questionVersion.statement}
        </h1>
        <div className="mt-6 space-y-3">
          {item.questionVersion.options.map((option) => (
            <label key={option.id} className="flex gap-3 rounded-xl border p-4">
              <input
                type={multiple ? "checkbox" : "radio"}
                name="answer"
                checked={selected.includes(option.id)}
                onChange={() =>
                  setSelected((value) =>
                    multiple
                      ? value.includes(option.id)
                        ? value.filter((id) => id !== option.id)
                        : [...value, option.id]
                      : [option.id],
                  )
                }
              />
              <span>
                <b>{option.label}</b> {option.content}
              </span>
            </label>
          ))}
        </div>
        <button
          disabled={
            !selected.length ||
            session.attempts.some((a) => a.questionId === item.questionId)
          }
          onClick={answer}
          className="mt-5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-40"
        >
          Responder
        </button>
        {feedback && (
          <p role="status" className="mt-3 font-semibold">
            {feedback}
          </p>
        )}
      </section>
      <div className="mt-4 flex justify-between">
        <button
          disabled={index === 0}
          onClick={() => {
            setIndex(index - 1);
            setSelected([]);
            setFeedback("");
          }}
          className="rounded-lg border px-4 py-2"
        >
          Anterior
        </button>
        {index < session.items.length - 1 ? (
          <button
            onClick={() => {
              setIndex(index + 1);
              setSelected([]);
              setFeedback("");
            }}
            className="rounded-lg border px-4 py-2"
          >
            Próxima
          </button>
        ) : (
          <button
            onClick={finish}
            className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white"
          >
            Finalizar sessão
          </button>
        )}
      </div>
    </div>
  );
}
