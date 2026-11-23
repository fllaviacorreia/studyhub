"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Question = {
  id: string;
  statement: string;
  kind: string;
  difficulty: string;
  provenance: string;
  year: number | null;
  board: { name: string; acronym: string | null } | null;
  topics: Array<{ topic: { name: string; subject: { name: string } } }>;
};
export function QuestionBank({
  questions,
  lists,
}: {
  questions: Question[];
  lists: Array<{ id: string; title: string; mode: string; count: number }>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("Minha lista de exercícios");
  const [mode, setMode] = useState("PRACTICE");
  const [message, setMessage] = useState("");
  async function createList() {
    const response = await fetch("/api/v1/exercise-lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, mode, questionIds: selected }),
    });
    setMessage(
      response.ok
        ? "Lista criada com sucesso."
        : "Não foi possível criar a lista.",
    );
    if (response.ok) router.refresh();
  }
  async function start(id: string) {
    const response = await fetch("/api/v1/question-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        exerciseListId: id,
        idempotencyKey: crypto.randomUUID(),
      }),
    });
    const payload = await response.json();
    if (response.ok) router.push(`/app/questoes/sessoes/${payload.data.id}`);
    else setMessage(payload.detail ?? "Não foi possível iniciar.");
  }
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">Banco de questões</p>
      <h1 className="mt-2 text-3xl font-bold">
        Pratique com questões objetivas
      </h1>
      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Montar lista manual</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-64 flex-1 rounded-lg border px-3 py-2"
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="PRACTICE">Prática</option>
            <option value="EXAM">Simulado</option>
          </select>
          <button
            disabled={!selected.length}
            onClick={createList}
            className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-40"
          >
            Criar com {selected.length}
          </button>
        </div>
        {message && (
          <p role="status" className="mt-2 text-sm">
            {message}
          </p>
        )}
      </section>
      <section className="mt-6 space-y-3">
        {questions.map((question) => (
          <label
            key={question.id}
            className="flex gap-4 rounded-2xl border bg-white p-5"
          >
            <input
              type="checkbox"
              checked={selected.includes(question.id)}
              onChange={() =>
                setSelected((value) =>
                  value.includes(question.id)
                    ? value.filter((id) => id !== question.id)
                    : [...value, question.id],
                )
              }
            />
            <span>
              <span className="text-xs font-bold uppercase text-teal-700">
                {question.difficulty} · {question.kind}
              </span>
              <span className="mt-2 block font-medium">
                {question.statement}
              </span>
              <span className="mt-2 block text-xs text-slate-500">
                {question.topics
                  .map((t) => `${t.topic.subject.name} / ${t.topic.name}`)
                  .join(", ")}
              </span>
            </span>
          </label>
        ))}
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-bold">Minhas listas</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {lists.map((list) => (
            <div key={list.id} className="rounded-2xl border bg-white p-5">
              <p className="font-bold">{list.title}</p>
              <p className="text-sm text-slate-500">
                {list.count} questões ·{" "}
                {list.mode === "EXAM" ? "Simulado" : "Prática"}
              </p>
              <button
                onClick={() => start(list.id)}
                className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Iniciar
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
