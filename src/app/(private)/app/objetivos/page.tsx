import { GoalsManager } from "../organization-client";
import { requireSessionActor } from "@/server/dal/session";
import { personalOrganizationService } from "@/server/personal-organization/service";
import { catalogService } from "@/server/catalog/service";

export default async function GoalsPage() {
  const actor = await requireSessionActor();
  const [goals, areas, examinations] = await Promise.all([personalOrganizationService.listObjectives(actor.id, { limit: 100 }), personalOrganizationService.listAreas(actor.id, { limit: 100 }), catalogService.listExaminations(actor, { limit: 100 })]) as [{ data: Parameters<typeof GoalsManager>[0]["initialGoals"] }, { data: Parameters<typeof GoalsManager>[0]["areas"] }, { data: Parameters<typeof GoalsManager>[0]["examinations"] }];
  return <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-teal-700">Organização</p><h1 className="mt-2 text-3xl font-bold">Objetivos</h1><p className="mb-8 mt-2 text-slate-600">Defina resultados, prioridades e prazos; o vínculo com um concurso continua opcional.</p><GoalsManager initialGoals={goals.data} areas={areas.data} examinations={examinations.data} /></div>;
}
