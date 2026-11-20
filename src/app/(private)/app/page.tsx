import { requireSessionActor } from "@/server/dal/session";

export default async function DashboardPage() {
  const actor = await requireSessionActor();
  const firstName = actor.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold text-teal-700">Visão geral</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{firstName ? `Olá, ${firstName}.` : "Olá."}</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Sua conta está pronta. Os recursos de organização e planejamento serão adicionados nas próximas entregas.</p>
      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12" aria-labelledby="empty-title">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-teal-50 text-2xl text-teal-700" aria-hidden="true">✓</div>
        <h2 id="empty-title" className="mt-4 text-lg font-semibold">Tudo pronto para começar</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Você ainda não possui dados de estudo. Nenhum conteúdo de demonstração foi inserido na sua conta.</p>
      </section>
    </div>
  );
}
