import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { OrganizationRepository } from "@/domains/personal-organization/service";
import { prisma } from "@/server/db/client";

function cleanNullable(value: string | null | undefined) {
  return value === undefined ? undefined : value || null;
}

const areaSelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  icon: true,
  status: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { objectives: true } },
} satisfies Prisma.StudyAreaSelect;

const objectiveSelect = {
  id: true,
  studyAreaId: true,
  name: true,
  description: true,
  priority: true,
  deadline: true,
  status: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  studyArea: { select: { id: true, name: true } },
  type: { select: { key: true, name: true } },
  examination: { select: { id: true, title: true, year: true, organization: { select: { name: true } } } },
  positions: { select: { position: { select: { id: true, title: true } }, specialization: { select: { id: true, name: true } } } },
} satisfies Prisma.ObjectiveSelect;

function page<T extends { id: string }>(items: T[], limit: number) {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  return { data, page: { nextCursor: hasMore ? data.at(-1)?.id ?? null : null, hasMore } };
}

function objectiveType(input: { type?: string; customTypeName?: string }) {
  if (!input.type) return undefined;
  return input.type === "CUSTOM"
    ? { key: `CUSTOM:${input.customTypeName!.trim().toUpperCase()}`, name: input.customTypeName! }
    : { key: input.type, name: ({
        PUBLIC_EXAM: "Concurso público",
        CERTIFICATION: "Certificação",
        ACADEMIC: "Acadêmico",
        PROFESSIONAL: "Profissional",
        PERSONAL: "Pessoal",
      } as Record<string, string>)[input.type] };
}

export const personalOrganizationRepository: OrganizationRepository = {
  async listAreas(actorId, query) {
    const items = await prisma.studyArea.findMany({
      where: { ownerId: actorId, status: query.status },
      select: areaSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getArea(actorId, id) {
    return prisma.studyArea.findFirst({ where: { id, ownerId: actorId }, select: areaSelect });
  },
  createArea(actorId, input) {
    return prisma.studyArea.create({
      data: { ownerId: actorId, name: input.name, description: cleanNullable(input.description), color: cleanNullable(input.color), icon: cleanNullable(input.icon) },
      select: areaSelect,
    });
  },
  async updateArea(actorId, id, input) {
    const statusData = input.status === "ARCHIVED"
      ? { status: "ARCHIVED" as const, archivedAt: new Date() }
      : input.status === "ACTIVE" ? { status: "ACTIVE" as const, archivedAt: null } : {};
    const result = await prisma.studyArea.updateMany({
      where: { id, ownerId: actorId },
      data: { name: input.name, description: cleanNullable(input.description), color: cleanNullable(input.color), icon: cleanNullable(input.icon), ...statusData },
    });
    return result.count ? this.getArea(actorId, id) : null;
  },
  async deleteArea(actorId, id) {
    const area = await prisma.studyArea.findFirst({ where: { id, ownerId: actorId }, select: { _count: { select: { objectives: true } } } });
    if (!area) return "not_found";
    if (area._count.objectives) return "has_objectives";
    await prisma.studyArea.deleteMany({ where: { id, ownerId: actorId } });
    return "deleted";
  },
  async listObjectives(actorId, query) {
    const items = await prisma.objective.findMany({
      where: {
        ownerId: actorId,
        studyAreaId: query.areaId,
        status: query.status,
        priority: query.priority,
        ...(query.hasTargetDate === undefined ? {} : { deadline: query.hasTargetDate ? { not: null } : null }),
      },
      select: objectiveSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getObjective(actorId, id) {
    return prisma.objective.findFirst({ where: { id, ownerId: actorId }, select: objectiveSelect });
  },
  async createObjective(actorId, input) {
    const area = await prisma.studyArea.findFirst({ where: { id: input.studyAreaId, ownerId: actorId }, select: { id: true } });
    if (!area) return null;
    const typeValue = objectiveType(input)!;
    return prisma.$transaction(async (tx) => {
      let type = await tx.objectiveType.findFirst({ where: { ownerId: input.type === "CUSTOM" ? actorId : null, key: typeValue.key }, select: { id: true } });
      type ??= await tx.objectiveType.create({ data: { ownerId: input.type === "CUSTOM" ? actorId : null, key: typeValue.key, name: typeValue.name, isSystem: input.type !== "CUSTOM" }, select: { id: true } });
      return tx.objective.create({
        data: { ownerId: actorId, studyAreaId: input.studyAreaId, typeId: type.id, name: input.title, description: cleanNullable(input.description), priority: input.priority, status: input.status, deadline: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null },
        select: objectiveSelect,
      });
    });
  },
  async updateObjective(actorId, id, input) {
    const current = await prisma.objective.findFirst({ where: { id, ownerId: actorId }, select: { id: true, typeId: true } });
    if (!current) return null;
    if (input.studyAreaId && !(await prisma.studyArea.findFirst({ where: { id: input.studyAreaId, ownerId: actorId }, select: { id: true } }))) return null;
    const typeValue = objectiveType(input);
    let typeId = current.typeId;
    if (typeValue) {
      const ownerId = input.type === "CUSTOM" ? actorId : null;
      let type = await prisma.objectiveType.findFirst({ where: { ownerId, key: typeValue.key }, select: { id: true } });
      type ??= await prisma.objectiveType.create({ data: { ownerId, key: typeValue.key, name: typeValue.name, isSystem: input.type !== "CUSTOM" }, select: { id: true } });
      typeId = type.id;
    }
    const statusData = input.status === "ARCHIVED" ? { status: "ARCHIVED" as const, archivedAt: new Date() } : input.status ? { status: input.status, archivedAt: null } : {};
    await prisma.objective.updateMany({
      where: { id, ownerId: actorId },
      data: { studyAreaId: input.studyAreaId, typeId, name: input.title, description: cleanNullable(input.description), priority: input.priority, deadline: input.targetDate === undefined ? undefined : input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null, ...statusData },
    });
    return this.getObjective(actorId, id);
  },
  async deleteObjective(actorId, id) {
    const objective = await prisma.objective.findFirst({
      where: { id, ownerId: actorId },
      select: { _count: { select: { plans: true, sessions: true } } },
    });
    if (!objective) return "not_found";
    if (objective._count.plans || objective._count.sessions) return "has_history";
    await prisma.objective.deleteMany({ where: { id, ownerId: actorId } });
    return "deleted";
  },
  async dashboard(actorId) {
    const [activeAreas, activeObjectives, withTargetDate, priorities] = await Promise.all([
      prisma.studyArea.count({ where: { ownerId: actorId, status: "ACTIVE" } }),
      prisma.objective.count({ where: { ownerId: actorId, status: "ACTIVE" } }),
      prisma.objective.count({ where: { ownerId: actorId, status: { not: "ARCHIVED" }, deadline: { not: null } } }),
      prisma.objective.groupBy({ by: ["priority"], where: { ownerId: actorId, status: "ACTIVE" }, _count: true }),
    ]);
    return { activeAreas, activeObjectives, withTargetDate, byPriority: Object.fromEntries(priorities.map((item) => [item.priority, item._count])) };
  },
};
