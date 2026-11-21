import { AreasManager } from "../organization-client";
import { requireSessionActor } from "@/server/dal/session";
import { personalOrganizationService } from "@/server/personal-organization/service";

export default async function AreasPage() {
  const actor = await requireSessionActor();
  const result = await personalOrganizationService.listAreas(actor.id, { limit: 100 }) as { data: Parameters<typeof AreasManager>[0]["initialAreas"] };
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-teal-700">Organização</p><h1 className="mt-2 text-3xl font-bold">Minhas áreas</h1><p className="mb-8 mt-2 text-slate-600">Organize seus objetivos por tema, projeto ou momento de vida.</p><AreasManager initialAreas={result.data} /></div>;
}
