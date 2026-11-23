import Link from "next/link";
import { catalogService } from "@/server/catalog/service";
import { requireSessionActor } from "@/server/dal/session";

type Exam = {
  id: string;
  title: string;
  year: number | null;
  status: string;
  publicationStatus: string;
  organization: { name: string; acronym: string | null };
  examBoard: { name: string; acronym: string | null } | null;
  _count: { positions: number; notices: number; syllabuses: number };
};
const labels: Record<string, string> = {
  PLANNED: "Planejado",
  AUTHORIZED: "Autorizado",
  BOARD_DEFINED: "Banca definida",
  NOTICE_PUBLISHED: "Edital publicado",
  REGISTRATION_OPEN: "Inscrições abertas",
  REGISTRATION_CLOSED: "Inscrições encerradas",
  EXAM_SCHEDULED: "Prova agendada",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export default async function ExaminationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [actor, params] = await Promise.all([
    requireSessionActor(),
    searchParams,
  ]);
  const search = typeof params.search === "string" ? params.search : undefined;
  const year =
    typeof params.year === "string" && params.year
      ? Number(params.year)
      : undefined;
  const result = (await catalogService.listExaminations(actor, {
    limit: 30,
    search,
    year,
  })) as { data: Exam[] };
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <p className="text-sm font-semibold text-teal-700">
          Catálogo compartilhado
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Concursos e processos seletivos
        </h1>
        <p className="mt-2 text-slate-600">
          Consulte dados publicados e suas fontes oficiais sem misturá-los aos
          seus objetivos pessoais.
        </p>
      </div>
      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_10rem_auto]">
        <input
          aria-label="Pesquisar"
          name="search"
          defaultValue={search}
          placeholder="Concurso ou instituição"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          aria-label="Ano"
          name="year"
          type="number"
          min="1900"
          max="2200"
          defaultValue={year}
          placeholder="Ano"
          className="rounded-lg border border-slate-300 px-3 py-2"
        />
        <button className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">
          Filtrar
        </button>
      </form>
      {!result.data.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold">Nenhum concurso encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ajuste os filtros ou aguarde a publicação do catálogo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.data.map((exam) => (
            <Link
              key={exam.id}
              href={`/app/concursos/${exam.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-teal-700">
                    {exam.organization.acronym || exam.organization.name}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">{exam.title}</h2>
                </div>
                {exam.year && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                    {exam.year}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {labels[exam.status] || exam.status}
                {exam.examBoard
                  ? ` · ${exam.examBoard.acronym || exam.examBoard.name}`
                  : " · banca não confirmada"}
              </p>
              <p className="mt-4 text-xs text-slate-500">
                {exam._count.positions} cargos ·{" "}
                {exam._count.notices ? "com edital" : "sem edital publicado"} ·{" "}
                {exam._count.syllabuses} conteúdos
              </p>
            </Link>
          ))}
        </div>
      )}
      {(actor.role === "CURATOR" || actor.role === "ADMIN") && (
        <Link
          href="/app/catalogo/administracao"
          className="inline-flex rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
        >
          Administrar catálogo
        </Link>
      )}
    </div>
  );
}
