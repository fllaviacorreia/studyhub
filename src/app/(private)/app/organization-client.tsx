"use client";

import { FormEvent, useState, useTransition } from "react";

type Area = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  status: "ACTIVE" | "ARCHIVED";
  _count: { objectives: number };
};
type Goal = {
  id: string;
  studyAreaId: string | null;
  name: string;
  description: string | null;
  priority: number;
  deadline: string | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  type: { key: string; name: string };
  studyArea: { id: string; name: string } | null;
  examination: {
    id: string;
    title: string;
    year: number | null;
    organization: { name: string };
  } | null;
  positions: {
    position: { id: string; title: string };
    specialization: { id: string; name: string } | null;
  }[];
};
type ExaminationOption = {
  id: string;
  title: string;
  year: number | null;
  organization: { name: string };
};
type ExamDetail = {
  positions: {
    id: string;
    title: string;
    specializations: { id: string; name: string }[];
  }[];
};
type Problem = { detail?: string; errors?: Record<string, string[]> };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as Problem;
    throw new Error(problem.detail || "Não foi possível concluir a operação.");
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}

const button =
  "rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export function AreasManager({ initialAreas }: { initialAreas: Area[] }) {
  const [areas, setAreas] = useState(initialAreas);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reload() {
    return request<{ data: Area[] }>("/api/v1/study-areas?limit=100").then(
      (result) => setAreas(result.data),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    startTransition(async () => {
      try {
        await request("/api/v1/study-areas", {
          method: "POST",
          body: JSON.stringify({
            name: data.get("name"),
            description: data.get("description") || null,
            color: data.get("color") || null,
            icon: data.get("icon") || null,
          }),
        });
        form.reset();
        await reload();
      } catch (caught) {
        setError((caught as Error).message);
      }
    });
  }

  function mutate(area: Area, action: "edit" | "toggle" | "delete") {
    let body: object | undefined;
    let method = "PATCH";
    if (action === "edit") {
      const name = window.prompt("Nome da área", area.name)?.trim();
      if (!name) return;
      const description = window.prompt(
        "Descrição (opcional)",
        area.description || "",
      );
      if (description === null) return;
      body = { name, description: description || null };
    } else if (action === "toggle")
      body = { status: area.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" };
    else {
      if (!window.confirm(`Excluir definitivamente “${area.name}”?`)) return;
      method = "DELETE";
    }
    setError("");
    startTransition(async () => {
      try {
        await request(`/api/v1/study-areas/${area.id}`, {
          method,
          body: body ? JSON.stringify(body) : undefined,
        });
        await reload();
      } catch (caught) {
        setError((caught as Error).message);
      }
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[22rem_1fr]">
      <form
        onSubmit={submit}
        className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <h2 className="font-semibold">Nova área</h2>
          <p className="mt-1 text-sm text-slate-500">
            Agrupe objetivos relacionados.
          </p>
        </div>
        <label className="block text-sm font-medium">
          Nome
          <input
            required
            minLength={2}
            maxLength={120}
            name="name"
            className={`${input} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium">
          Descrição
          <textarea
            name="description"
            maxLength={2000}
            rows={3}
            className={`${input} mt-1 resize-y`}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Cor
            <input
              name="color"
              type="color"
              defaultValue="#0f766e"
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 p-1"
            />
          </label>
          <label className="block text-sm font-medium">
            Ícone
            <input
              name="icon"
              maxLength={40}
              placeholder="Ex.: 📚"
              className={`${input} mt-1`}
            />
          </label>
        </div>
        <button
          disabled={pending}
          className={`${button} w-full bg-teal-700 text-white hover:bg-teal-800`}
        >
          {pending ? "Salvando…" : "Criar área"}
        </button>
      </form>
      <section aria-live="polite">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {!areas.length ? (
          <Empty
            title="Nenhuma área criada"
            text="Crie sua primeira área para começar a organizar objetivos."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {areas.map((area) => (
              <article
                key={area.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-xl"
                      style={{
                        backgroundColor: area.color
                          ? `${area.color}20`
                          : "#f1f5f9",
                        color: area.color || undefined,
                      }}
                    >
                      {area.icon || "◎"}
                    </span>
                    <div>
                      <h2 className="font-semibold">{area.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {area._count.objectives}{" "}
                        {area._count.objectives === 1
                          ? "objetivo"
                          : "objetivos"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${area.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {area.status === "ACTIVE" ? "Ativa" : "Arquivada"}
                  </span>
                </div>
                {area.description && (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {area.description}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    disabled={pending}
                    onClick={() => mutate(area, "edit")}
                    className={`${button} border border-slate-300 hover:bg-slate-50`}
                  >
                    Editar
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => mutate(area, "toggle")}
                    className={`${button} border border-slate-300 hover:bg-slate-50`}
                  >
                    {area.status === "ACTIVE" ? "Arquivar" : "Restaurar"}
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => mutate(area, "delete")}
                    className={`${button} text-red-700 hover:bg-red-50`}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function GoalsManager({
  initialGoals,
  areas,
  examinations,
}: {
  initialGoals: Goal[];
  areas: Area[];
  examinations: ExaminationOption[];
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const activeAreas = areas.filter((area) => area.status === "ACTIVE");
  const reload = () =>
    request<{ data: Goal[] }>("/api/v1/study-goals?limit=100").then((result) =>
      setGoals(result.data),
    );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    startTransition(async () => {
      try {
        await request("/api/v1/study-goals", {
          method: "POST",
          body: JSON.stringify({
            studyAreaId: data.get("studyAreaId"),
            title: data.get("title"),
            type: data.get("type"),
            priority: Number(data.get("priority")),
            targetDate: data.get("targetDate") || null,
            description: data.get("description") || null,
          }),
        });
        form.reset();
        await reload();
      } catch (caught) {
        setError((caught as Error).message);
      }
    });
  }
  function patch(goal: Goal, body: object) {
    setError("");
    startTransition(async () => {
      try {
        await request(`/api/v1/study-goals/${goal.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        await reload();
      } catch (caught) {
        setError((caught as Error).message);
      }
    });
  }
  function edit(goal: Goal) {
    const title = window.prompt("Título do objetivo", goal.name)?.trim();
    if (!title) return;
    patch(goal, { title });
  }
  function remove(goal: Goal) {
    if (
      !window.confirm(
        `Excluir definitivamente “${goal.name}”? Registros históricos podem impedir a exclusão.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await request(`/api/v1/study-goals/${goal.id}`, { method: "DELETE" });
        await reload();
      } catch (caught) {
        setError((caught as Error).message);
      }
    });
  }

  return (
    <div className="space-y-7">
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-6"
      >
        <label className="text-sm font-medium xl:col-span-2">
          Título
          <input
            required
            minLength={2}
            name="title"
            className={`${input} mt-1`}
          />
        </label>
        <label className="text-sm font-medium">
          Área
          <select required name="studyAreaId" className={`${input} mt-1`}>
            <option value="">Selecione</option>
            {activeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Tipo
          <select name="type" className={`${input} mt-1`}>
            <option value="PERSONAL">Pessoal</option>
            <option value="PUBLIC_EXAM">Concurso público</option>
            <option value="CERTIFICATION">Certificação</option>
            <option value="ACADEMIC">Acadêmico</option>
            <option value="PROFESSIONAL">Profissional</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Prioridade
          <select name="priority" defaultValue="3" className={`${input} mt-1`}>
            <option value="1">1 — baixa</option>
            <option value="2">2</option>
            <option value="3">3 — média</option>
            <option value="4">4</option>
            <option value="5">5 — alta</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Prazo
          <input name="targetDate" type="date" className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium md:col-span-2 xl:col-span-5">
          Descrição
          <input name="description" className={`${input} mt-1`} />
        </label>
        <button
          disabled={pending || !activeAreas.length}
          className={`${button} self-end bg-teal-700 text-white hover:bg-teal-800`}
        >
          Adicionar
        </button>
        {!activeAreas.length && (
          <p className="text-sm text-amber-700 md:col-span-2 xl:col-span-6">
            Crie ou restaure uma área antes de adicionar objetivos.
          </p>
        )}
      </form>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {!goals.length ? (
        <Empty
          title="Nenhum objetivo criado"
          text="Adicione um objetivo a uma das suas áreas."
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <article
              key={goal.id}
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{goal.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    Prioridade {goal.priority}
                  </span>
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-800">
                    {goal.status === "ACTIVE"
                      ? "Ativo"
                      : goal.status === "PAUSED"
                        ? "Pausado"
                        : goal.status === "COMPLETED"
                          ? "Concluído"
                          : "Arquivado"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {goal.studyArea?.name} · {goal.type.name}
                  {goal.deadline
                    ? ` · prazo ${new Date(goal.deadline).toLocaleDateString("pt-BR", { timeZone: "UTC" })}`
                    : ""}
                </p>
                {goal.examination && (
                  <p className="mt-2 text-sm font-medium text-teal-800">
                    {goal.examination.organization.name} ·{" "}
                    {goal.examination.title}
                    {goal.positions.length
                      ? ` · ${goal.positions.map((item) => item.specialization?.name || item.position.title).join(", ")}`
                      : ""}
                  </p>
                )}
                <CatalogLink
                  goal={goal}
                  examinations={examinations}
                  onSaved={reload}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => edit(goal)}
                  className={`${button} border border-slate-300`}
                >
                  Editar
                </button>
                <select
                  aria-label={`Mover ${goal.name}`}
                  value={goal.studyAreaId || ""}
                  onChange={(event) =>
                    patch(goal, { studyAreaId: event.target.value })
                  }
                  className={input}
                >
                  {activeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={`Status de ${goal.name}`}
                  value={goal.status}
                  onChange={(event) =>
                    patch(goal, { status: event.target.value })
                  }
                  className={input}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="PAUSED">Pausado</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
                <button
                  onClick={() => remove(goal)}
                  className={`${button} text-red-700`}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogLink({
  goal,
  examinations,
  onSaved,
}: {
  goal: Goal;
  examinations: ExaminationOption[];
  onSaved: () => Promise<void>;
}) {
  const [examId, setExamId] = useState(goal.examination?.id || "");
  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [selected, setSelected] = useState<string[]>(
    goal.positions.map(
      (item) => `${item.position.id}:${item.specialization?.id || ""}`,
    ),
  );
  const [busy, setBusy] = useState(false);
  async function choose(value: string) {
    setExamId(value);
    setSelected([]);
    if (!value) {
      setDetail(null);
      return;
    }
    const result = await request<{ data: ExamDetail }>(
      `/api/v1/examinations/${value}`,
    );
    setDetail(result.data);
  }
  async function save() {
    setBusy(true);
    try {
      await request(`/api/v1/study-goals/${goal.id}/catalog`, {
        method: "PUT",
        body: JSON.stringify({
          examinationId: examId || null,
          selections: selected.map((value) => {
            const [positionId, specializationId] = value.split(":");
            return { positionId, specializationId: specializationId || null };
          }),
        }),
      });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-semibold text-teal-700">
        Vincular concurso e cargos
      </summary>
      <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
        <select
          value={examId}
          onChange={(event) => void choose(event.target.value)}
          className={input}
        >
          <option value="">Sem concurso vinculado</option>
          {examinations.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.organization.name} · {exam.title}
              {exam.year ? ` (${exam.year})` : ""}
            </option>
          ))}
        </select>
        {detail?.positions.map((position) => (
          <div key={position.id}>
            <p className="text-sm font-semibold">{position.title}</p>
            {position.specializations.length ? (
              position.specializations.map((specialization) => {
                const value = `${position.id}:${specialization.id}`;
                return (
                  <label key={specialization.id} className="mr-4 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(value)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, value]
                            : current.filter((item) => item !== value),
                        )
                      }
                    />{" "}
                    {specialization.name}
                  </label>
                );
              })
            ) : (
              <label className="text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(`${position.id}:`)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, `${position.id}:`]
                        : current.filter((item) => item !== `${position.id}:`),
                    )
                  }
                />{" "}
                Selecionar cargo
              </label>
            )}
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className={`${button} bg-teal-700 text-white`}
        >
          {busy ? "Salvando…" : "Salvar vínculo"}
        </button>
      </div>
    </details>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}
