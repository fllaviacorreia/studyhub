import { notFound } from "next/navigation";
import { CatalogAdmin } from "./catalog-admin";
import { catalogService } from "@/server/catalog/service";
import { requireSessionActor } from "@/server/dal/session";

export default async function CatalogAdminPage() {
  const actor = await requireSessionActor();
  if (actor.role === "USER") notFound();
  const [organizations, boards] = (await Promise.all([
    catalogService.listOrganizations({ limit: 100 }),
    catalogService.listExamBoards({ limit: 100 }),
  ])) as [
    { data: { id: string; name: string }[] },
    { data: { id: string; name: string }[] },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">Curadoria</p>
      <h1 className="mt-2 text-3xl font-bold">Administração do catálogo</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Cadastre instituições e concursos como rascunho; publique somente após
        conferir a fonte.
      </p>
      <CatalogAdmin organizations={organizations.data} boards={boards.data} />
    </div>
  );
}
