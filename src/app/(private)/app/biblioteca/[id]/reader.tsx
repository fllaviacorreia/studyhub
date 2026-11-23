"use client";
import { useState } from "react";

type Material = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  estimatedMinutes: number | null;
  progress: { progressPercentage: number; lastPosition: string | null } | null;
  sources: Array<{
    id: string;
    title: string;
    sourceType: string;
    sourceUrl: string | null;
    author: string | null;
    publicationDate: string | null;
    description: string | null;
  }>;
};
export function MaterialReader({ material }: { material: Material }) {
  const [progress, setProgress] = useState(
    material.progress?.progressPercentage ?? 0,
  );
  const [message, setMessage] = useState("");
  async function save(value: number, completed = false) {
    const response = await fetch(`/api/v1/learning-progress/${material.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        progressPercentage: value,
        lastPosition: `percent:${value}`,
        completed,
      }),
    });
    if (response.ok) {
      setProgress(completed ? 100 : value);
      setMessage("Progresso salvo.");
    } else setMessage("Não foi possível salvar o progresso.");
  }
  return (
    <article className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold text-teal-700">
        Leitor de conteúdo ·{" "}
        {material.estimatedMinutes
          ? `${material.estimatedMinutes} min`
          : "tempo livre"}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{material.title}</h1>
      {material.summary && (
        <p className="mt-3 text-lg text-slate-600">{material.summary}</p>
      )}
      <div className="sticky top-16 z-10 mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            aria-label="Progresso de leitura"
            className="w-full"
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
          <span className="w-12 text-sm font-bold">{progress}%</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => save(progress)}
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
          >
            Salvar posição
          </button>
          <button
            onClick={() => save(100, true)}
            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
          >
            Marcar como concluído
          </button>
        </div>
        {message && (
          <p role="status" className="mt-2 text-sm text-slate-600">
            {message}
          </p>
        )}
      </div>
      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 leading-8 shadow-sm">
        {material.content.split(/\n{2,}/).map((block, index) =>
          block.startsWith("# ") ? (
            <h2 key={index} className="text-2xl font-bold">
              {block.slice(2)}
            </h2>
          ) : block.startsWith("## ") ? (
            <h3 key={index} className="text-xl font-bold">
              {block.slice(3)}
            </h3>
          ) : (
            <p key={index} className="whitespace-pre-wrap">
              {block}
            </p>
          ),
        )}
      </div>
      {material.sources.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Fontes e referências</h2>
          <ul className="mt-3 space-y-2">
            {material.sources.map((source) => (
              <li key={source.id} className="rounded-xl border bg-white p-4">
                <span className="text-xs font-bold text-teal-700">
                  {source.sourceType}
                </span>
                <p className="font-semibold">
                  {source.sourceUrl ? (
                    <a
                      className="underline"
                      href={source.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
