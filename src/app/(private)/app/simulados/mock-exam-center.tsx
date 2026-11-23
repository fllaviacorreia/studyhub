"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
type Exam = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  totalQuestions: number;
  status: string;
  scoringStrategy: string;
  _count: { attempts: number };
};
type Subject = { id: string; name: string };
export function MockExamCenter({
  exams,
  subjects,
}: {
  exams: Exam[];
  subjects: Subject[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const create = async (formData: FormData) => {
    setError("");
    const totalQuestions = Number(formData.get("totalQuestions"));
    const subjectId = String(formData.get("subjectId") || "") || null;
    const response = await fetch("/api/v1/mock-exams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        durationMinutes: Number(formData.get("durationMinutes")) || null,
        totalQuestions,
        scoringStrategy: formData.get("scoringStrategy"),
        selectionSeed: crypto.randomUUID(),
        filters: {},
        sections: [
          {
            title: subjectId
              ? subjects.find((s) => s.id === subjectId)?.name
              : "Bloco geral",
            subjectId,
            questionCount: totalQuestions,
            weight: 1,
            order: 0,
            filters: {},
          },
        ],
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.detail ?? "Não foi possível criar.");
      return;
    }
    const generated = await fetch(
      `/api/v1/mock-exams/${body.data.id}/generate`,
      { method: "POST" },
    );
    if (!generated.ok) {
      const problem = await generated.json();
      setError(`Simulado salvo como rascunho. ${problem.detail}`);
    }
    router.refresh();
  };
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">
        Avaliação personalizada
      </p>
      <h1 className="mt-2 text-3xl font-bold">Central de simulados</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_1fr]">
        <form
          action={create}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-bold">Novo simulado</h2>
          <label className="mt-4 block text-sm font-semibold">
            Título
            <input
              name="title"
              required
              minLength={2}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Disciplina
            <select
              name="subjectId"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            >
              <option value="">Todas</option>
              {subjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold">
              Questões
              <input
                name="totalQuestions"
                type="number"
                min="1"
                max="500"
                defaultValue="10"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Minutos
              <input
                name="durationMinutes"
                type="number"
                min="1"
                max="1440"
                defaultValue="30"
                className="mt-1 w-full rounded-lg border border-slate-300 p-2"
              />
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold">
            Pontuação
            <select
              name="scoringStrategy"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2"
            >
              <option value="SIMPLE">Simples</option>
              <option value="WEIGHTED_BY_SECTION">Ponderada por bloco</option>
            </select>
          </label>
          <button className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800">
            Criar e validar
          </button>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
        <section>
          <h2 className="text-xl font-bold">Seus simulados</h2>
          <div className="mt-4 space-y-3">
            {exams.map((exam) => (
              <article
                key={exam.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{exam.title}</p>
                    <p className="text-sm text-slate-500">
                      {exam.totalQuestions} questões ·{" "}
                      {exam.durationMinutes ?? "sem limite"} min ·{" "}
                      {exam._count.attempts} tentativa(s)
                    </p>
                    <p className="mt-1 text-xs font-semibold text-teal-700">
                      {exam.status}
                    </p>
                  </div>
                  {exam.status === "READY" && (
                    <Link
                      href={`/app/simulados/${exam.id}/realizar`}
                      className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Iniciar
                    </Link>
                  )}
                </div>
              </article>
            ))}
            {!exams.length && (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
                Nenhum simulado criado.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
