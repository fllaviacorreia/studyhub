import Link from "next/link";
import { requireSessionActor } from "@/server/dal/session";
import { personalOrganizationService } from "@/server/personal-organization/service";

export default async function DashboardPage() {
  const actor = await requireSessionActor();
  const firstName = actor.name?.split(" ")[0];
  const summary = (await personalOrganizationService.dashboard(actor.id)) as {
    activeAreas: number;
    activeObjectives: number;
    withTargetDate: number;
    byPriority: Record<string, number>;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">Visão geral</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {firstName ? `Olá, ${firstName}.` : "Olá."}
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Acompanhe suas áreas e objetivos de estudo.
      </p>
      <section
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumo dos estudos"
      >
        <Metric label="Áreas ativas" value={summary.activeAreas} />
        <Metric label="Objetivos ativos" value={summary.activeObjectives} />
        <Metric label="Com prazo definido" value={summary.withTargetDate} />
        <Metric
          label="Prioridade alta (4–5)"
          value={(summary.byPriority[4] || 0) + (summary.byPriority[5] || 0)}
        />
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/app/areas"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300"
        >
          <h2 className="font-semibold">Minhas áreas →</h2>
          <p className="mt-2 text-sm text-slate-600">
            Crie, edite, arquive e restaure áreas de estudo.
          </p>
        </Link>
        <Link
          href="/app/objetivos"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300"
        >
          <h2 className="font-semibold">Objetivos →</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gerencie prioridades, prazos, status e vínculos.
          </p>
        </Link>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}
