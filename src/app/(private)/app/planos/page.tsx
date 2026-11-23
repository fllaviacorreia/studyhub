import { requireSessionActor } from "@/server/dal/session";
import { planningRepository } from "@/server/dal/planning";
import { PlansManager } from "./plans-manager";

export default async function PlansPage() {
  const actor = await requireSessionActor();
  const plans = await planningRepository.listPlans(actor.id, { limit: 100 });
  const serialized = plans.data.map((plan) => ({
    ...plan,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate?.toISOString() ?? null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    archivedAt: plan.archivedAt?.toISOString() ?? null,
  }));
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">Planejamento</p>
      <h1 className="mt-2 text-3xl font-bold">Meus planos</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Crie rascunhos, associe objetivos e confirme o cronograma somente depois
        de revisar a prévia.
      </p>
      <PlansManager initialPlans={serialized} />
    </div>
  );
}
