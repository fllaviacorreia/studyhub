import { requireSessionActor } from "@/server/dal/session";
import { planningRepository } from "@/server/dal/planning";
export default async function AgendaPage() {
  const actor = await requireSessionActor();
  const tasks = await planningRepository.listTasks(actor.id, { limit: 100 });
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-teal-700">Execução</p>
      <h1 className="mt-2 text-3xl font-bold">Agenda</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Atividades planejadas em ordem cronológica.
      </p>
      <div className="space-y-3">
        {tasks.data.length ? (
          tasks.data.map((task) => (
            <article
              key={task.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(task.scheduledStart).toLocaleString("pt-BR", {
                      timeZone: task.plan.timezone,
                    })}{" "}
                    · {task.scheduledMinutes} min · {task.plan.name}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                  {task.status}
                </span>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
            Nenhuma atividade agendada.
          </p>
        )}
      </div>
    </div>
  );
}
