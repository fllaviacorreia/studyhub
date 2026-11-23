import Link from "next/link";
import { learningRepository } from "@/server/dal/learning";
import { requireSessionActor } from "@/server/dal/session";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const actor = await requireSessionActor();
  const { busca } = await searchParams;
  const result = await learningRepository.listMaterials(actor, {
    limit: 50,
    search: busca,
  });
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">
        Biblioteca de estudos
      </p>
      <h1 className="mt-2 text-3xl font-bold">
        Conteúdos para avançar no seu ritmo
      </h1>
      <form className="mt-6">
        <input
          name="busca"
          defaultValue={busca}
          placeholder="Pesquisar por título"
          className="w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-3"
        />
      </form>
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {result.data.map((material) => (
          <Link
            key={material.id}
            href={`/app/biblioteca/${material.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300"
          >
            <div className="flex justify-between gap-3">
              <span className="text-xs font-bold uppercase text-teal-700">
                {material.kind}
              </span>
              <span className="text-xs text-slate-500">
                {material.estimatedMinutes
                  ? `${material.estimatedMinutes} min`
                  : "Leitura livre"}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-bold">{material.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">
              {material.summary || "Material de estudo"}
            </p>
            <p className="mt-4 text-xs font-semibold text-slate-500">
              {material.progress[0]?.progressPercentage ?? 0}% concluído
            </p>
          </Link>
        ))}
      </section>
      {!result.data.length && (
        <p className="mt-10 text-slate-600">Nenhum material encontrado.</p>
      )}
    </div>
  );
}
