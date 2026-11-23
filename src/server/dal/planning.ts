import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { PlanningError } from "@/domains/planning/errors";
import { generateSchedule, type PlannedTask } from "@/domains/planning/engine";
import type {
  CreatePlanInput,
  UpdatePlanInput,
} from "@/domains/planning/schemas";
import type { z } from "zod";
import type {
  taskSchema,
  updateTaskSchema,
  createSessionSchema,
  updateSessionSchema,
  planTopicSchema,
} from "@/domains/planning/schemas";

const planSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  dailyTargetMinutes: true,
  weeklyTargetMinutes: true,
  planningStrategy: true,
  timezone: true,
  version: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { objectives: true, topics: true, tasks: true } },
} satisfies Prisma.StudyPlanSelect;
const taskSelect = {
  id: true,
  planId: true,
  studyPlanTopicId: true,
  reviewScheduleId: true,
  mockExamId: true,
  title: true,
  description: true,
  activityType: true,
  scheduledDate: true,
  scheduledStart: true,
  plannedEndAt: true,
  scheduledMinutes: true,
  status: true,
  origin: true,
  manualLock: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  plan: { select: { name: true, timezone: true } },
  studyPlanTopic: {
    select: {
      id: true,
      customTitle: true,
      topic: { select: { name: true } },
      objectives: { select: { objectiveId: true } },
    },
  },
} satisfies Prisma.PlanTaskSelect;

const civilDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const dateText = (value: Date) => value.toISOString().slice(0, 10);
const minuteOf = (value: string) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
const timeOf = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const page = <T extends { id: string }>(items: T[], limit: number) => ({
  data: items.slice(0, limit),
  page: {
    hasMore: items.length > limit,
    nextCursor: items.length > limit ? (items[limit - 1]?.id ?? null) : null,
  },
});

function localToUtc(date: string, minute: number, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const hour = Math.floor(minute / 60),
    minutePart = minute % 60;
  let guess = Date.UTC(year, month - 1, day, hour, minutePart);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (let iteration = 0; iteration < 3; iteration++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    guess += Date.UTC(year, month - 1, day, hour, minutePart) - represented;
  }
  const result = new Date(guess);
  const verification = formatter
    .formatToParts(result)
    .filter((part) => part.type !== "literal")
    .map((part) => part.value)
    .join(":");
  if (
    !verification.includes(String(hour).padStart(2, "0")) ||
    !verification.endsWith(String(minutePart).padStart(2, "0"))
  )
    throw new PlanningError(
      "CONFLICT",
      "O horário local não existe no fuso do plano devido à transição de horário.",
    );
  return result;
}

async function ownedPlan(actorId: string, id: string) {
  const plan = await prisma.studyPlan.findFirst({
    where: { id, ownerId: actorId },
  });
  if (!plan) throw new PlanningError("NOT_FOUND", "Plano não encontrado.");
  return plan;
}

export const planningRepository = {
  async listPlans(
    actorId: string,
    query: {
      cursor?: string;
      limit: number;
      status?: Prisma.EnumStudyPlanStatusFilter["equals"];
    },
  ) {
    const items = await prisma.studyPlan.findMany({
      where: { ownerId: actorId, status: query.status },
      select: planSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  async getPlan(actorId: string, id: string) {
    const plan = await prisma.studyPlan.findFirst({
      where: { id, ownerId: actorId },
      select: {
        ...planSelect,
        objectives: {
          select: {
            objectiveId: true,
            priorityWeight: true,
            objective: { select: { name: true, deadline: true } },
          },
        },
        availability: {
          orderBy: [
            { dayOfWeek: "asc" as const },
            { startMinute: "asc" as const },
          ],
        },
        topics: {
          select: {
            id: true,
            topicId: true,
            syllabusItemId: true,
            customTitle: true,
            customSubject: true,
            estimatedMinutes: true,
            priority: true,
            status: true,
            objectives: { select: { objectiveId: true } },
          },
        },
      },
    });
    if (!plan) throw new PlanningError("NOT_FOUND", "Plano não encontrado.");
    return plan;
  },
  createPlan(actorId: string, input: CreatePlanInput) {
    return prisma.studyPlan.create({
      data: {
        ownerId: actorId,
        name: input.title,
        description: input.description,
        status: input.status,
        startDate: civilDate(input.startDate),
        endDate: input.endDate ? civilDate(input.endDate) : null,
        dailyTargetMinutes: input.dailyTargetMinutes,
        weeklyTargetMinutes: input.weeklyTargetMinutes,
        planningStrategy: input.planningStrategy,
        timezone: input.timezone,
      },
      select: planSelect,
    });
  },
  async updatePlan(actorId: string, id: string, input: UpdatePlanInput) {
    await ownedPlan(actorId, id);
    await prisma.studyPlan.updateMany({
      where: { id, ownerId: actorId },
      data: {
        name: input.title,
        description: input.description,
        status: input.status,
        startDate: input.startDate ? civilDate(input.startDate) : undefined,
        endDate:
          input.endDate === undefined
            ? undefined
            : input.endDate
              ? civilDate(input.endDate)
              : null,
        dailyTargetMinutes: input.dailyTargetMinutes,
        weeklyTargetMinutes: input.weeklyTargetMinutes,
        planningStrategy: input.planningStrategy,
        timezone: input.timezone,
        archivedAt:
          input.status === "ARCHIVED"
            ? new Date()
            : input.status
              ? null
              : undefined,
        version: { increment: 1 },
      },
    });
    return this.getPlan(actorId, id);
  },
  async archivePlan(actorId: string, id: string) {
    await ownedPlan(actorId, id);
    await prisma.studyPlan.updateMany({
      where: { id, ownerId: actorId },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        version: { increment: 1 },
      },
    });
  },
  async addGoal(
    actorId: string,
    planId: string,
    input: { studyGoalId: string; priorityWeight: number },
  ) {
    await ownedPlan(actorId, planId);
    const objective = await prisma.objective.findFirst({
      where: { id: input.studyGoalId, ownerId: actorId },
      select: { id: true },
    });
    if (!objective)
      throw new PlanningError(
        "INVALID_DEPENDENCY",
        "O objetivo não pertence a você.",
      );
    await prisma.$transaction([
      prisma.studyPlanObjective.create({
        data: {
          planId,
          objectiveId: objective.id,
          priorityWeight: input.priorityWeight,
        },
      }),
      prisma.studyPlan.update({
        where: { id: planId },
        data: { version: { increment: 1 } },
      }),
    ]);
  },
  async removeGoal(actorId: string, planId: string, objectiveId: string) {
    await ownedPlan(actorId, planId);
    const result = await prisma.studyPlanObjective.deleteMany({
      where: { planId, objectiveId, objective: { ownerId: actorId } },
    });
    if (!result.count)
      throw new PlanningError("NOT_FOUND", "Objetivo não vinculado ao plano.");
    await prisma.studyPlan.update({
      where: { id: planId },
      data: { version: { increment: 1 } },
    });
  },
  async getAvailability(actorId: string, planId: string) {
    await ownedPlan(actorId, planId);
    const rows = await prisma.studyAvailability.findMany({
      where: { planId },
      orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        weekday: row.dayOfWeek,
        startTime: timeOf(row.startMinute),
        endTime: timeOf(row.endMinute),
        isEnabled: row.isEnabled,
      })),
    };
  },
  async replaceAvailability(
    actorId: string,
    planId: string,
    intervals: Array<{
      weekday: number;
      startTime: string;
      endTime: string;
      isEnabled: boolean;
    }>,
  ) {
    await ownedPlan(actorId, planId);
    const normalized = intervals.map((item) => ({
      ...item,
      startMinute: minuteOf(item.startTime),
      endMinute: minuteOf(item.endTime),
    }));
    for (const item of normalized)
      if (item.startMinute >= item.endMinute)
        throw new PlanningError(
          "CONFLICT",
          "O início deve ser anterior ao término.",
        );
    for (let i = 0; i < normalized.length; i++)
      for (let j = i + 1; j < normalized.length; j++)
        if (
          normalized[i].isEnabled &&
          normalized[j].isEnabled &&
          normalized[i].weekday === normalized[j].weekday &&
          normalized[i].startMinute < normalized[j].endMinute &&
          normalized[j].startMinute < normalized[i].endMinute
        )
          throw new PlanningError(
            "CONFLICT",
            "Há horários de disponibilidade sobrepostos.",
          );
    await prisma.$transaction(async (tx) => {
      await tx.studyAvailability.deleteMany({ where: { planId } });
      await tx.studyAvailability.createMany({
        data: normalized.map((item) => ({
          planId,
          dayOfWeek: item.weekday,
          startMinute: item.startMinute,
          endMinute: item.endMinute,
          isEnabled: item.isEnabled,
        })),
      });
      await tx.studyPlan.update({
        where: { id: planId },
        data: { version: { increment: 1 } },
      });
    });
    return this.getAvailability(actorId, planId);
  },
  async addTopic(
    actorId: string,
    planId: string,
    input: z.infer<typeof planTopicSchema>,
  ) {
    await ownedPlan(actorId, planId);
    const goals = await prisma.studyPlanObjective.findMany({
      where: {
        planId,
        objectiveId: { in: input.objectiveIds },
        objective: { ownerId: actorId },
      },
      select: { objectiveId: true },
    });
    if (goals.length !== new Set(input.objectiveIds).size)
      throw new PlanningError(
        "INVALID_DEPENDENCY",
        "Todos os objetivos devem estar vinculados ao plano.",
      );
    return prisma.$transaction(async (tx) => {
      const topic = await tx.studyPlanTopic.create({
        data: {
          planId,
          topicId: input.topicId,
          syllabusItemId: input.syllabusItemId,
          customTitle: input.custom?.title,
          customSubject: input.custom?.subject,
          estimatedMinutes: input.estimatedMinutes,
          priority: input.priority,
          objectives: {
            createMany: {
              data: [...new Set(input.objectiveIds)].map((objectiveId) => ({
                objectiveId,
              })),
            },
          },
        },
      });
      await tx.studyPlan.update({
        where: { id: planId },
        data: { version: { increment: 1 } },
      });
      return topic;
    });
  },
  async createPreview(
    actorId: string,
    planId: string,
    expectedVersion: number,
    kind: "GENERATE" | "REPLAN",
  ) {
    const plan = await prisma.studyPlan.findFirst({
      where: { id: planId, ownerId: actorId },
      include: {
        objectives: { include: { objective: true } },
        availability: true,
        topics: {
          include: { topic: true, syllabusItem: true, objectives: true },
        },
        tasks: {
          where: { OR: [{ manualLock: true }, { status: "COMPLETED" }] },
        },
      },
    });
    if (!plan) throw new PlanningError("NOT_FOUND", "Plano não encontrado.");
    if (plan.version !== expectedVersion)
      throw new PlanningError(
        "STALE_PREVIEW",
        "O plano foi alterado; gere uma nova prévia.",
      );
    const endDate =
      plan.endDate ??
      plan.objectives
        .map((item) => item.objective.deadline)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => a.getTime() - b.getTime())[0];
    if (!endDate)
      throw new PlanningError(
        "CONFLICT",
        "Defina a data final do plano ou um prazo confirmado.",
      );
    const result = generateSchedule({
      startDate: dateText(plan.startDate),
      endDate: dateText(endDate),
      timezone: plan.timezone,
      strategy: plan.planningStrategy,
      objectives: plan.objectives.map((item) => ({
        id: item.objectiveId,
        priorityWeight: Number(item.priorityWeight),
        deadline: item.objective.deadline
          ? dateText(item.objective.deadline)
          : null,
      })),
      topics: plan.topics.map((item) => ({
        id: item.id,
        title:
          item.topic?.name ?? item.syllabusItem?.title ?? item.customTitle!,
        estimatedMinutes: item.estimatedMinutes,
        priority: item.priority,
        objectiveIds: item.objectives.map((objective) => objective.objectiveId),
      })),
      availability: plan.availability
        .filter((item) => item.isEnabled)
        .map((item) => ({
          weekday: item.dayOfWeek,
          startMinute: item.startMinute,
          endMinute: item.endMinute,
        })),
      fixedTasks: plan.tasks.map((task) => ({
        id: task.id,
        topicId: task.studyPlanTopicId,
        startAt: task.scheduledStart.toISOString(),
        estimatedMinutes: task.scheduledMinutes,
      })),
    });
    const proposal = {
      ...result,
      fingerprint: createHash("sha256")
        .update(JSON.stringify(result))
        .digest("hex"),
    };
    return prisma.planningPreview.create({
      data: {
        planId,
        planVersion: plan.version,
        kind,
        proposal,
        expiresAt: new Date(Date.now() + 30 * 60_000),
      },
      select: {
        id: true,
        planVersion: true,
        kind: true,
        proposal: true,
        expiresAt: true,
      },
    });
  },
  async applyPreview(
    actorId: string,
    planId: string,
    previewId: string,
    version: number,
  ) {
    await ownedPlan(actorId, planId);
    return prisma.$transaction(async (tx) => {
      const preview = await tx.planningPreview.findFirst({
        where: {
          id: previewId,
          planId,
          plan: { ownerId: actorId },
          status: "PENDING",
        },
      });
      const plan = await tx.studyPlan.findUnique({ where: { id: planId } });
      if (!preview || !plan)
        throw new PlanningError("NOT_FOUND", "Prévia não encontrada.");
      if (
        preview.planVersion !== version ||
        plan.version !== version ||
        preview.expiresAt <= new Date()
      )
        throw new PlanningError(
          "STALE_PREVIEW",
          "A prévia expirou ou o plano foi alterado.",
        );
      const proposal = preview.proposal as unknown as { tasks: PlannedTask[] };
      if (preview.kind === "REPLAN")
        await tx.planTask.deleteMany({
          where: {
            planId,
            origin: { in: ["GENERATED", "RESCHEDULED"] },
            manualLock: false,
            status: { not: "COMPLETED" },
          },
        });
      for (const task of proposal.tasks) {
        const start = localToUtc(
          task.scheduledDate,
          task.startMinute,
          plan.timezone,
        );
        await tx.planTask.upsert({
          where: {
            planId_generationKey: { planId, generationKey: task.generationKey },
          },
          update: {},
          create: {
            planId,
            studyPlanTopicId: task.topicId,
            title: task.title,
            activityType: "THEORY",
            scheduledDate: civilDate(task.scheduledDate),
            scheduledStart: start,
            plannedEndAt: new Date(
              start.getTime() + task.estimatedMinutes * 60_000,
            ),
            scheduledMinutes: task.estimatedMinutes,
            origin: preview.kind === "REPLAN" ? "RESCHEDULED" : "GENERATED",
            generationKey: task.generationKey,
          },
        });
      }
      const revisionNumber =
        (await tx.studyPlanRevision.count({ where: { planId } })) + 1;
      await tx.studyPlanRevision.create({
        data: {
          planId,
          revisionNumber,
          reason:
            preview.kind === "REPLAN"
              ? "Replanejamento confirmado"
              : "Cronograma gerado",
          changeSummary: { previewId, taskCount: proposal.tasks.length },
        },
      });
      await tx.planningPreview.update({
        where: { id: preview.id },
        data: { status: "APPLIED", appliedAt: new Date() },
      });
      await tx.studyPlan.update({
        where: { id: planId },
        data: { version: { increment: 1 } },
      });
      return { revisionNumber, taskCount: proposal.tasks.length };
    });
  },
  async schedule(actorId: string, planId: string) {
    await ownedPlan(actorId, planId);
    return {
      data: await prisma.planTask.findMany({
        where: { planId, plan: { ownerId: actorId } },
        select: taskSelect,
        orderBy: [{ scheduledStart: "asc" }, { id: "asc" }],
      }),
    };
  },
  async progress(actorId: string, planId: string) {
    await ownedPlan(actorId, planId);
    const [tasks, sessions] = await Promise.all([
      prisma.planTask.groupBy({
        by: ["status"],
        where: { planId, plan: { ownerId: actorId } },
        _count: true,
        _sum: { scheduledMinutes: true },
      }),
      prisma.studySession.aggregate({
        where: { planId, userId: actorId, endedAt: { not: null } },
        _sum: { durationSeconds: true },
      }),
    ]);
    const plannedMinutes = tasks.reduce(
        (sum, item) => sum + (item._sum.scheduledMinutes ?? 0),
        0,
      ),
      completed =
        tasks.find((item) => item.status === "COMPLETED")?._count ?? 0,
      total = tasks.reduce((sum, item) => sum + item._count, 0);
    return {
      plannedMinutes,
      studiedMinutes: Math.floor((sessions._sum.durationSeconds ?? 0) / 60),
      completedTasks: completed,
      pendingTasks: total - completed,
      completionPercentage: total ? Math.round((completed / total) * 100) : 0,
    };
  },
  async listTasks(
    actorId: string,
    query: {
      cursor?: string;
      limit: number;
      planId?: string;
      status?: Prisma.EnumTaskStatusFilter["equals"];
      from?: string;
      to?: string;
    },
  ) {
    const items = await prisma.planTask.findMany({
      where: {
        plan: { ownerId: actorId },
        planId: query.planId,
        status: query.status,
        scheduledDate:
          query.from || query.to
            ? {
                gte: query.from ? civilDate(query.from) : undefined,
                lte: query.to ? civilDate(query.to) : undefined,
              }
            : undefined,
      },
      select: taskSelect,
      orderBy: [{ scheduledStart: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  async createTask(actorId: string, input: z.infer<typeof taskSchema>) {
    await ownedPlan(actorId, input.studyPlanId);
    if (
      input.studyPlanTopicId &&
      !(await prisma.studyPlanTopic.findFirst({
        where: {
          id: input.studyPlanTopicId,
          planId: input.studyPlanId,
          plan: { ownerId: actorId },
        },
        select: { id: true },
      }))
    )
      throw new PlanningError(
        "INVALID_DEPENDENCY",
        "O assunto não pertence ao plano.",
      );
    if (
      input.reviewScheduleId &&
      !(await prisma.reviewSchedule.findFirst({
        where: {
          id: input.reviewScheduleId,
          userId: actorId,
          status: "ACTIVE",
        },
        select: { id: true },
      }))
    )
      throw new PlanningError(
        "INVALID_DEPENDENCY",
        "A revisão não pertence a você ou não está ativa.",
      );
    if (
      input.mockExamId &&
      !(await prisma.mockExam.findFirst({
        where: { id: input.mockExamId, userId: actorId, status: "READY" },
        select: { id: true },
      }))
    )
      throw new PlanningError(
        "INVALID_DEPENDENCY",
        "O simulado não pertence a você ou não está pronto.",
      );
    return prisma.planTask.create({
      data: {
        planId: input.studyPlanId,
        studyPlanTopicId: input.studyPlanTopicId,
        reviewScheduleId: input.reviewScheduleId,
        mockExamId: input.mockExamId,
        title: input.title,
        description: input.description,
        activityType: input.activityType,
        scheduledDate: civilDate(input.scheduledDate),
        scheduledStart: new Date(input.plannedStartAt),
        plannedEndAt: input.plannedEndAt ? new Date(input.plannedEndAt) : null,
        scheduledMinutes: input.estimatedMinutes,
        origin: "MANUAL",
        manualLock: input.isLocked,
      },
      select: taskSelect,
    });
  },
  async updateTask(
    actorId: string,
    id: string,
    input: z.infer<typeof updateTaskSchema>,
  ) {
    const current = await prisma.planTask.findFirst({
      where: { id, plan: { ownerId: actorId } },
    });
    if (!current)
      throw new PlanningError("NOT_FOUND", "Atividade não encontrada.");
    if (
      current.status === "COMPLETED" &&
      Object.keys(input).some((key) => !["status"].includes(key))
    )
      throw new PlanningError(
        "CONFLICT",
        "Uma atividade concluída não pode ser alterada.",
      );
    await prisma.planTask.update({
      where: { id },
      data: {
        studyPlanTopicId: input.studyPlanTopicId,
        reviewScheduleId: input.reviewScheduleId,
        mockExamId: input.mockExamId,
        title: input.title,
        description: input.description,
        activityType: input.activityType,
        scheduledDate: input.scheduledDate
          ? civilDate(input.scheduledDate)
          : undefined,
        scheduledStart: input.plannedStartAt
          ? new Date(input.plannedStartAt)
          : undefined,
        plannedEndAt:
          input.plannedEndAt === undefined
            ? undefined
            : input.plannedEndAt
              ? new Date(input.plannedEndAt)
              : null,
        scheduledMinutes: input.estimatedMinutes,
        manualLock: input.isLocked,
        status: input.status,
        completedAt:
          input.status === "COMPLETED"
            ? new Date()
            : input.status
              ? null
              : undefined,
      },
    });
    return prisma.planTask.findUnique({ where: { id }, select: taskSelect });
  },
  async cancelTask(actorId: string, id: string) {
    const result = await prisma.planTask.updateMany({
      where: { id, plan: { ownerId: actorId }, status: { not: "COMPLETED" } },
      data: { status: "CANCELLED" },
    });
    if (!result.count)
      throw new PlanningError(
        "NOT_FOUND",
        "Atividade não encontrada ou já concluída.",
      );
  },
  async listSessions(
    actorId: string,
    query: { cursor?: string; limit: number; planId?: string },
  ) {
    const items = await prisma.studySession.findMany({
      where: { userId: actorId, planId: query.planId },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  async createSession(
    actorId: string,
    input: z.infer<typeof createSessionSchema>,
  ) {
    if (input.studyPlanId) await ownedPlan(actorId, input.studyPlanId);
    if (input.studyTaskId) {
      const task = await prisma.planTask.findFirst({
        where: {
          id: input.studyTaskId,
          plan: { ownerId: actorId },
          ...(input.studyPlanId ? { planId: input.studyPlanId } : {}),
        },
        select: { planId: true },
      });
      if (!task)
        throw new PlanningError(
          "INVALID_DEPENDENCY",
          "A atividade não pertence a você.",
        );
      input.studyPlanId ??= task.planId;
    }
    const endedAt = input.endedAt ? new Date(input.endedAt) : null,
      startedAt = new Date(input.startedAt);
    if (endedAt && endedAt < startedAt)
      throw new PlanningError(
        "CONFLICT",
        "O término não pode anteceder o início.",
      );
    const durationSeconds =
      input.durationSeconds ??
      (endedAt
        ? Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
        : null);
    return prisma.studySession.create({
      data: {
        userId: actorId,
        planId: input.studyPlanId,
        taskId: input.studyTaskId,
        kind: input.kind,
        startedAt,
        endedAt,
        durationSeconds,
        notes: input.notes,
      },
    });
  },
  async updateSession(
    actorId: string,
    id: string,
    input: z.infer<typeof updateSessionSchema>,
  ) {
    const current = await prisma.studySession.findFirst({
      where: { id, userId: actorId },
    });
    if (!current)
      throw new PlanningError("NOT_FOUND", "Sessão não encontrada.");
    const endedAt =
      input.endedAt === undefined
        ? current.endedAt
        : input.endedAt
          ? new Date(input.endedAt)
          : null;
    if (endedAt && endedAt < current.startedAt)
      throw new PlanningError(
        "CONFLICT",
        "O término não pode anteceder o início.",
      );
    const durationSeconds =
      input.durationSeconds ??
      (endedAt
        ? Math.floor((endedAt.getTime() - current.startedAt.getTime()) / 1000)
        : undefined);
    return prisma.studySession.update({
      where: { id },
      data: { endedAt, durationSeconds, notes: input.notes },
    });
  },
};
