export type PlanningStrategy = "BALANCED" | "PRIORITY_BASED" | "DEADLINE_BASED";

export type PlanningTopic = {
  id: string;
  title: string;
  estimatedMinutes: number;
  priority: number;
  objectiveIds: string[];
};

export type PlanningObjective = {
  id: string;
  priorityWeight: number;
  deadline?: string | null;
};

export type AvailabilitySlot = {
  weekday: number;
  startMinute: number;
  endMinute: number;
};
export type FixedTask = {
  id: string;
  topicId?: string | null;
  startAt: string;
  estimatedMinutes: number;
};

export type PlanningInput = {
  startDate: string;
  endDate: string;
  strategy: PlanningStrategy;
  timezone: string;
  objectives: PlanningObjective[];
  topics: PlanningTopic[];
  availability: AvailabilitySlot[];
  fixedTasks?: FixedTask[];
  minimumTaskMinutes?: number;
};

export type PlannedTask = {
  topicId: string;
  title: string;
  scheduledDate: string;
  startMinute: number;
  estimatedMinutes: number;
  objectiveIds: string[];
  generationKey: string;
};

export type PlanningResult = {
  tasks: PlannedTask[];
  unallocated: Array<{ topicId: string; missingMinutes: number }>;
  capacityMinutes: number;
  requiredMinutes: number;
  missingMinutes: number;
};

const DAY_MS = 86_400_000;

function dateRange(start: string, end: string) {
  const first = Date.parse(`${start}T00:00:00.000Z`);
  const last = Date.parse(`${end}T00:00:00.000Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first > last)
    throw new Error("Período de planejamento inválido.");
  const dates: string[] = [];
  for (let value = first; value <= last; value += DAY_MS)
    dates.push(new Date(value).toISOString().slice(0, 10));
  return dates;
}

function topicScore(topic: PlanningTopic, input: PlanningInput) {
  const objectives = input.objectives.filter((objective) =>
    topic.objectiveIds.includes(objective.id),
  );
  const weight =
    objectives.reduce(
      (sum, objective) =>
        sum + (input.strategy === "BALANCED" ? 1 : objective.priorityWeight),
      0,
    ) || 1;
  if (input.strategy !== "DEADLINE_BASED") return topic.priority * weight;
  const start = Date.parse(`${input.startDate}T00:00:00Z`);
  const urgency = objectives.reduce((sum, objective) => {
    if (!objective.deadline) return sum + objective.priorityWeight;
    const days = Math.max(
      1,
      Math.ceil(
        (Date.parse(`${objective.deadline}T00:00:00Z`) - start) / DAY_MS,
      ),
    );
    return sum + objective.priorityWeight / days;
  }, 0);
  return topic.priority * (urgency || 1);
}

/** Pure, deterministic planner. Civil dates/minutes are converted to UTC only by the persistence boundary. */
export function generateSchedule(input: PlanningInput): PlanningResult {
  if (!input.objectives.length || !input.topics.length)
    throw new Error("Informe objetivos e assuntos para gerar o cronograma.");
  if (!input.availability.length)
    throw new Error("Informe ao menos um horário disponível.");
  for (const slot of input.availability) {
    if (
      slot.weekday < 0 ||
      slot.weekday > 6 ||
      slot.startMinute < 0 ||
      slot.endMinute > 1440 ||
      slot.startMinute >= slot.endMinute
    )
      throw new Error("Disponibilidade inválida.");
  }
  const minimum = input.minimumTaskMinutes ?? 15;
  const dates = dateRange(input.startDate, input.endDate);
  const occupied = new Map<string, Array<[number, number]>>();
  for (const fixed of input.fixedTasks ?? []) {
    const date = fixed.startAt.slice(0, 10);
    const instant = new Date(fixed.startAt);
    const minute = instant.getUTCHours() * 60 + instant.getUTCMinutes();
    occupied.set(date, [
      ...(occupied.get(date) ?? []),
      [minute, minute + fixed.estimatedMinutes],
    ]);
  }
  const windows = dates
    .flatMap((date) => {
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      return input.availability
        .filter((slot) => slot.weekday === weekday)
        .map((slot) => ({
          date,
          start: slot.startMinute,
          end: slot.endMinute,
        }));
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const capacityMinutes = windows.reduce(
    (sum, window) => sum + window.end - window.start,
    0,
  );
  const ordered = [...input.topics].sort(
    (a, b) =>
      topicScore(b, input) - topicScore(a, input) || a.id.localeCompare(b.id),
  );
  const remaining = new Map(
    ordered.map((topic) => [topic.id, topic.estimatedMinutes]),
  );
  const tasks: PlannedTask[] = [];
  let cursor = 0;
  for (const window of windows) {
    let minute = window.start;
    const blocks = (occupied.get(window.date) ?? []).sort(
      (a, b) => a[0] - b[0],
    );
    while (minute < window.end && [...remaining.values()].some(Boolean)) {
      const collision = blocks.find(
        ([start, end]) => minute < end && window.end > start,
      );
      if (collision && minute >= collision[0]) {
        minute = collision[1];
        continue;
      }
      const availableEnd = collision
        ? Math.min(window.end, collision[0])
        : window.end;
      const topic = ordered
        .slice(cursor)
        .concat(ordered.slice(0, cursor))
        .find((candidate) => (remaining.get(candidate.id) ?? 0) > 0);
      if (!topic) break;
      const duration = Math.min(
        remaining.get(topic.id)!,
        availableEnd - minute,
      );
      if (duration < minimum && remaining.get(topic.id)! > duration) {
        minute = availableEnd;
        continue;
      }
      tasks.push({
        topicId: topic.id,
        title: topic.title,
        scheduledDate: window.date,
        startMinute: minute,
        estimatedMinutes: duration,
        objectiveIds: [...new Set(topic.objectiveIds)].sort(),
        generationKey: `${topic.id}:${window.date}:${minute}`,
      });
      remaining.set(topic.id, remaining.get(topic.id)! - duration);
      minute += duration;
      cursor = (ordered.indexOf(topic) + 1) % ordered.length;
    }
  }
  const unallocated = ordered.flatMap((topic) =>
    remaining.get(topic.id)
      ? [{ topicId: topic.id, missingMinutes: remaining.get(topic.id)! }]
      : [],
  );
  const requiredMinutes = input.topics.reduce(
    (sum, topic) => sum + topic.estimatedMinutes,
    0,
  );
  return {
    tasks,
    unallocated,
    capacityMinutes,
    requiredMinutes,
    missingMinutes: unallocated.reduce(
      (sum, item) => sum + item.missingMinutes,
      0,
    ),
  };
}
