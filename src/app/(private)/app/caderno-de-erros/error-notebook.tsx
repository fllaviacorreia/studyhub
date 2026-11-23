"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Entry = {
  id: string;
  status: string;
  notes: string | null;
  question: {
    statement: string;
    difficulty: string;
    board: { name: string } | null;
    topics: { topic: { name: string; subject: { name: string } } }[];
  };
};
export function ErrorNotebook({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [status, setStatus] = useState("ALL");
  const shown =
    status === "ALL"
      ? entries
      : entries.filter((entry) => entry.status === status);
  const update = async (id: string, data: object) => {
    await fetch(`/api/v1/error-notebook/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  };
  const retry = async (id: string) => {
    const response = await fetch(`/api/v1/error-notebook/${id}/retry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
    });
    const body = await response.json();
    if (response.ok) router.push(`/app/questoes/sessoes/${body.data.id}`);
  };
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">
        Aprenda com as tentativas
      </p>
      <h1 className="mt-2 text-3xl font-bold">Caderno de erros</h1>
      <div className="mt-6">
        <label className="text-sm font-semibold" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="ml-3 rounded-lg border border-slate-300 p-2"
        >
          <option value="ALL">Todos</option>
          <option value="OPEN">Abertos</option>
          <option value="REVIEWING">Em revisão</option>
          <option value="RESOLVED">Resolvidos</option>
        </select>
      </div>
      <div className="mt-6 space-y-4">
        {shown.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">{entry.question.statement}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {entry.question.topics
                    .map(({ topic }) => `${topic.subject.name} · ${topic.name}`)
                    .join("; ")}{" "}
                  · {entry.question.board?.name ?? "Sem banca"} ·{" "}
                  {entry.question.difficulty}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => retry(entry.id)}
                  className="rounded-lg border border-teal-300 px-3 py-2 text-sm font-semibold text-teal-800"
                >
                  Refazer
                </button>
                <select
                  aria-label="Alterar status"
                  value={entry.status}
                  onChange={(event) =>
                    update(entry.id, { status: event.target.value })
                  }
                  className="rounded-lg border border-slate-300 p-2"
                >
                  <option value="OPEN">Aberto</option>
                  <option value="REVIEWING">Em revisão</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
              </div>
            </div>
            <textarea
              aria-label="Anotações pessoais"
              defaultValue={entry.notes ?? ""}
              onBlur={(event) =>
                update(entry.id, { notes: event.target.value })
              }
              className="mt-4 min-h-24 w-full rounded-xl border border-slate-300 p-3"
              placeholder="O que levou ao erro?"
            />
          </article>
        ))}
        {!shown.length && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
            Nenhum erro neste filtro.
          </p>
        )}
      </div>
    </div>
  );
}
