"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Item = {
  position: number;
  questionId: string;
  questionVersion: {
    statement: string;
    options: Array<{ id: string; label: string; content: string }>;
  };
};
type Attempt = {
  id: string;
  deadlineAt: string | null;
  session: {
    items: Item[];
    attempts: Array<{ questionId: string; selectedOptionIds: string[] }>;
  };
};
export function MockExamRunner({ examId }: { examId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt>();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      const key = `studyhub-mock-${examId}`;
      let attemptId = localStorage.getItem(key);
      if (!attemptId) {
        const response = await fetch(`/api/v1/mock-exams/${examId}/start`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
        });
        const body = await response.json();
        if (!response.ok) {
          setError(body.detail);
          return;
        }
        attemptId = body.data.id;
        localStorage.setItem(key, attemptId!);
      }
      const response = await fetch(`/api/v1/mock-exam-attempts/${attemptId}`);
      const body = await response.json();
      if (response.ok) setAttempt(body.data);
      else setError(body.detail);
    })();
  }, [examId]);
  useEffect(() => {
    if (!attempt?.deadlineAt) return;
    const tick = () =>
      setRemaining(
        Math.max(
          0,
          Math.floor(
            (new Date(attempt.deadlineAt!).getTime() - Date.now()) / 1000,
          ),
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attempt]);
  if (error)
    return (
      <p
        role="alert"
        className="mx-auto max-w-3xl rounded-xl bg-red-50 p-5 text-red-800"
      >
        {error}
      </p>
    );
  if (!attempt) return <p className="p-8 text-center">Preparando simulado…</p>;
  const item = attempt.session.items[index];
  const save = async () => {
    if (!item || !selected.length) return;
    const response = await fetch(
      `/api/v1/mock-exam-attempts/${attempt.id}/answers`,
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
    if (response.ok) {
      setSelected([]);
      setIndex(Math.min(index + 1, attempt.session.items.length - 1));
    } else setError((await response.json()).detail);
  };
  const finish = async () => {
    if (!confirm("Finalizar e corrigir o simulado?")) return;
    const response = await fetch(
      `/api/v1/mock-exam-attempts/${attempt.id}/finish`,
      { method: "POST" },
    );
    if (response.ok) {
      localStorage.removeItem(`studyhub-mock-${examId}`);
      router.push(`/app/simulados/tentativas/${attempt.id}/resultado`);
    } else setError((await response.json()).detail);
  };
  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal-700">
            Questão {index + 1} de {attempt.session.items.length}
          </p>
          <h1 className="text-2xl font-bold">Simulado em andamento</h1>
        </div>
        <p
          aria-live="polite"
          className="rounded-lg bg-slate-950 px-4 py-2 font-mono text-white"
        >
          {remaining == null
            ? "Sem limite"
            : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </p>
      </header>
      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-lg font-semibold">
          {item?.questionVersion.statement}
        </p>
        <div className="mt-5 space-y-3">
          {item?.questionVersion.options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <input
                type="radio"
                name="answer"
                checked={selected.includes(option.id)}
                onChange={() => setSelected([option.id])}
              />
              <span>
                <strong>{option.label}.</strong> {option.content}
              </span>
            </label>
          ))}
        </div>
      </article>
      <footer className="mt-5 flex flex-wrap justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setIndex(Math.max(0, index - 1))}
            className="rounded-lg border px-4 py-2"
          >
            Anterior
          </button>
          <button
            onClick={save}
            disabled={!selected.length}
            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            Salvar e avançar
          </button>
        </div>
        <button
          onClick={finish}
          className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700"
        >
          Finalizar
        </button>
      </footer>
    </div>
  );
}
