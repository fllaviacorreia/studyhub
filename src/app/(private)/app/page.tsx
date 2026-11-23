import Link from "next/link";
import { requireSessionActor } from "@/server/dal/session";
import { personalOrganizationService } from "@/server/personal-organization/service";
import { reviewRepository } from "@/server/dal/reviews";
import { mockExamRepository } from "@/server/dal/mock-exams";

export default async function DashboardPage() {
  const actor = await requireSessionActor();
  const firstName = actor.name?.split(" ")[0];
  const [summary, reviews, mockExams] = (await Promise.all([
    personalOrganizationService.dashboard(actor.id),
    reviewRepository.list(actor.id, { limit: 100, status: "ACTIVE", days: 0 }),
    mockExamRepository.list(actor.id, { limit: 100 }),
  ])) as [
    {
      activeAreas: number;
      activeObjectives: number;
      withTargetDate: number;
      byPriority: Record<string, number>;
    },
    { items: unknown[] },
    { items: Array<{ _count: { attempts: number } }> },
  ];

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
          href="/app/revisoes"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300"
        >
          <h2 className="font-semibold">Revisões pendentes →</h2>
          <p className="mt-2 text-sm text-slate-600">
            {reviews.items.length} revisão(ões) prevista(s) até agora.
          </p>
        </Link>
        <Link
          href="/app/simulados"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300"
        >
          <h2 className="font-semibold">Simulados →</h2>
          <p className="mt-2 text-sm text-slate-600">
            {mockExams.items.reduce(
              (sum, item) => sum + item._count.attempts,
              0,
            )}{" "}
            tentativa(s) registrada(s).
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
