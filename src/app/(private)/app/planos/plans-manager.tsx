"use client";
import { FormEvent, useState, useTransition } from "react";
type Plan = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  planningStrategy: string;
  timezone: string;
  _count: { objectives: number; topics: number; tasks: number };
};
async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json" },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Não foi possível concluir a operação.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
export function PlansManager({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans),
    [error, setError] = useState("");
  const [pending, start] = useTransition();
  const reload = () =>
    call<{ data: Plan[] }>("/api/v1/study-plans?limit=100").then((value) =>
      setPlans(value.data),
    );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      data = new FormData(form);
    start(async () => {
      try {
        setError("");
        await call("/api/v1/study-plans", {
          method: "POST",
          body: JSON.stringify({
            title: data.get("title"),
            startDate: data.get("startDate"),
            endDate: data.get("endDate") || null,
            planningStrategy: data.get("planningStrategy"),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            status: "DRAFT",
          }),
        });
        form.reset();
        await reload();
      } catch (value) {
        setError((value as Error).message);
      }
    });
  }
  function archive(id: string) {
    start(async () => {
      try {
        await call(`/api/v1/study-plans/${id}`, { method: "DELETE" });
        await reload();
      } catch (value) {
        setError((value as Error).message);
      }
    });
  }
  return (
    <div className="grid gap-8 xl:grid-cols-[22rem_1fr]">
      <form
        onSubmit={submit}
        className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold">Novo plano</h2>
        <label className="block text-sm font-medium">
          Título
          <input
            required
            minLength={2}
            name="title"
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium">
          Início
          <input
            required
            type="date"
            name="startDate"
            className={`${field} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium">
          Fim opcional
          <input type="date" name="endDate" className={`${field} mt-1`} />
        </label>
        <label className="block text-sm font-medium">
          Estratégia
          <select name="planningStrategy" className={`${field} mt-1`}>
            <option value="BALANCED">Equilibrada</option>
            <option value="PRIORITY_BASED">Por prioridade</option>
            <option value="DEADLINE_BASED">Por prazo confirmado</option>
          </select>
        </label>
        <button
          disabled={pending}
          className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
        >
          {pending ? "Salvando…" : "Salvar rascunho"}
        </button>
      </form>
      <section>
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {!plans.length ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
            Nenhum plano criado.
          </p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {plan._count.objectives} objetivos · {plan._count.topics}{" "}
                      assuntos · {plan._count.tasks} atividades
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fuso: {plan.timezone}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                    {plan.status}
                  </span>
                </div>
                {plan.status !== "ARCHIVED" && (
                  <button
                    onClick={() => archive(plan.id)}
                    className="mt-4 text-sm font-semibold text-red-700"
                  >
                    Arquivar
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
