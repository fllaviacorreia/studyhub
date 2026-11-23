import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { CatalogRepository } from "@/domains/catalog/service";
import { prisma } from "@/server/db/client";

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
const slug = (value: string) =>
  normalize(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const nullable = (value: string | null | undefined) =>
  value === undefined ? undefined : value || null;
const date = (value: string | null | undefined) =>
  value === undefined ? undefined : value ? new Date(value) : null;
function page<T extends { id: string }>(items: T[], limit: number) {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  return {
    data,
    page: { nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null, hasMore },
  };
}

const examinationSummary = {
  id: true,
  title: true,
  description: true,
  year: true,
  status: true,
  publicationStatus: true,
  registrationStartAt: true,
  registrationEndAt: true,
  examDate: true,
  officialUrl: true,
  sourceReference: true,
  organization: { select: { id: true, name: true, acronym: true } },
  examBoard: { select: { id: true, name: true, acronym: true } },
  _count: { select: { positions: true, notices: true, syllabuses: true } },
} satisfies Prisma.ExaminationSelect;

export const catalogRepository: CatalogRepository = {
  async listOrganizations(query) {
    const items = await prisma.organization.findMany({
      where: query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { acronym: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        acronym: true,
        description: true,
        website: true,
        country: true,
        parent: { select: { id: true, name: true } },
        _count: { select: { examinations: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getOrganization(id) {
    return prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        acronym: true,
        description: true,
        website: true,
        country: true,
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        examinations: {
          where: { publicationStatus: "PUBLISHED" },
          select: examinationSummary,
          orderBy: [{ year: "desc" }, { title: "asc" }],
        },
      },
    });
  },
  createOrganization(input) {
    return prisma.organization.create({
      data: {
        ...input,
        normalizedName: normalize(input.name),
        acronym: nullable(input.acronym),
        description: nullable(input.description),
        website: nullable(input.website),
      },
      select: { id: true, name: true, acronym: true },
    });
  },
  async updateOrganization(id, input) {
    if (
      !(await prisma.organization.findUnique({
        where: { id },
        select: { id: true },
      }))
    )
      return null;
    return prisma.organization.update({
      where: { id },
      data: {
        ...input,
        normalizedName: input.name ? normalize(input.name) : undefined,
        acronym: nullable(input.acronym),
        description: nullable(input.description),
        website: nullable(input.website),
      },
      select: { id: true, name: true, acronym: true },
    });
  },
  async listExamBoards(query) {
    const items = await prisma.examBoard.findMany({
      where: query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { acronym: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        acronym: true,
        website: true,
        _count: { select: { examinations: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  createExamBoard(input) {
    return prisma.examBoard.create({
      data: {
        ...input,
        normalizedName: normalize(input.name),
        acronym: nullable(input.acronym),
        website: nullable(input.website),
      },
      select: { id: true, name: true, acronym: true },
    });
  },
  async listExaminations(query, canReview) {
    const items = await prisma.examination.findMany({
      where: {
        ...(canReview ? {} : { publicationStatus: "PUBLISHED" }),
        organizationId: query.organizationId,
        examBoardId: query.examBoardId,
        year: query.year,
        status: query.status,
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                {
                  organization: {
                    name: { contains: query.search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      select: examinationSummary,
      orderBy: [{ year: "desc" }, { title: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getExamination(id, canReview) {
    return prisma.examination.findFirst({
      where: { id, ...(canReview ? {} : { publicationStatus: "PUBLISHED" }) },
      select: {
        ...examinationSummary,
        positions: {
          select: {
            id: true,
            title: true,
            description: true,
            educationLevel: true,
            requirements: true,
            vacancies: true,
            specializations: {
              select: {
                id: true,
                name: true,
                description: true,
                vacancies: true,
              },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { title: "asc" },
        },
        notices: {
          where: canReview ? {} : { status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            noticeNumber: true,
            documentType: true,
            publicationDate: true,
            officialUrl: true,
            sourceReference: true,
            originalNoticeId: true,
            versions: {
              where: canReview ? {} : { status: "PUBLISHED" },
              select: {
                id: true,
                version: true,
                documentUrl: true,
                contentHash: true,
                publishedAt: true,
                changeDescription: true,
              },
              orderBy: { version: "desc" },
            },
          },
          orderBy: [{ publicationDate: "desc" }, { title: "asc" }],
        },
        syllabuses: {
          where: canReview ? {} : { status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            positionId: true,
            specializationId: true,
            items: {
              select: {
                id: true,
                parentItemId: true,
                title: true,
                description: true,
                order: true,
                weight: true,
                numberOfQuestions: true,
                subject: { select: { id: true, name: true } },
                topic: { select: { id: true, name: true } },
              },
              orderBy: [{ order: "asc" }, { title: "asc" }],
            },
          },
          orderBy: { title: "asc" },
        },
      },
    });
  },
  createExamination(input) {
    return prisma.examination.create({
      data: {
        ...input,
        description: nullable(input.description),
        registrationStartAt: date(input.registrationStartAt),
        registrationEndAt: date(input.registrationEndAt),
        examDate: date(input.examDate),
        officialUrl: nullable(input.officialUrl),
        sourceReference: nullable(input.sourceReference),
      },
      select: examinationSummary,
    });
  },
  async updateExamination(id, input) {
    if (
      !(await prisma.examination.findUnique({
        where: { id },
        select: { id: true },
      }))
    )
      return null;
    return prisma.examination.update({
      where: { id },
      data: {
        ...input,
        description: nullable(input.description),
        registrationStartAt: date(input.registrationStartAt),
        registrationEndAt: date(input.registrationEndAt),
        examDate: date(input.examDate),
        officialUrl: nullable(input.officialUrl),
        sourceReference: nullable(input.sourceReference),
      },
      select: examinationSummary,
    });
  },
  async createPosition(examinationId, input) {
    if (
      !(await prisma.examination.findUnique({
        where: { id: examinationId },
        select: { id: true },
      }))
    )
      return null;
    return prisma.position.create({
      data: {
        examinationId,
        title: input.title,
        description: nullable(input.description),
        educationLevel: nullable(input.educationLevel),
        requirements: nullable(input.requirements),
        vacancies: input.vacancies,
        specializations: {
          create: input.specializations.map((item) => ({
            ...item,
            description: nullable(item.description),
          })),
        },
      },
      select: {
        id: true,
        title: true,
        specializations: { select: { id: true, name: true } },
      },
    });
  },
  async createNotice(examinationId, input) {
    if (
      input.originalNoticeId &&
      !(await prisma.notice.findFirst({
        where: { id: input.originalNoticeId, examinationId },
        select: { id: true },
      }))
    )
      return null;
    if (
      !(await prisma.examination.findUnique({
        where: { id: examinationId },
        select: { id: true },
      }))
    )
      return null;
    return prisma.notice.create({
      data: {
        ...input,
        examinationId,
        publicationDate: date(input.publicationDate),
        noticeNumber: nullable(input.noticeNumber),
        officialUrl: nullable(input.officialUrl),
        filePath: nullable(input.filePath),
        sourceReference: nullable(input.sourceReference),
      },
      select: { id: true, title: true, documentType: true, status: true },
    });
  },
  async createNoticeVersion(noticeId, input) {
    if (
      !(await prisma.notice.findUnique({
        where: { id: noticeId },
        select: { id: true },
      }))
    )
      return null;
    return prisma.noticeVersion.create({
      data: {
        noticeId,
        version: input.versionNumber,
        documentUrl: nullable(input.documentUrl),
        contentHash: nullable(input.contentHash),
        publishedAt: date(input.publishedAt),
        changeDescription: nullable(input.changeDescription),
        status: input.status,
      },
      select: { id: true, version: true, status: true },
    });
  },
  async listSubjects(query, canReview) {
    const items = await prisma.subject.findMany({
      where: {
        ...(canReview ? {} : { status: "PUBLISHED" }),
        ...(query.search
          ? { name: { contains: query.search, mode: "insensitive" } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        _count: { select: { topics: true } },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getSubjectTopics(id, canReview) {
    return prisma.subject.findFirst({
      where: { id, ...(canReview ? {} : { status: "PUBLISHED" }) },
      select: {
        id: true,
        name: true,
        description: true,
        topics: {
          select: {
            id: true,
            parentId: true,
            name: true,
            description: true,
            position: true,
          },
          orderBy: [{ position: "asc" }, { name: "asc" }],
        },
      },
    });
  },
  createSubject(input) {
    return prisma.subject.create({
      data: {
        name: input.name,
        slug: slug(input.name),
        description: nullable(input.description),
        status: input.status,
      },
      select: { id: true, name: true, slug: true, status: true },
    });
  },
  async createTopic(subjectId, input) {
    if (
      input.parentTopicId &&
      !(await prisma.topic.findFirst({
        where: { id: input.parentTopicId, subjectId },
        select: { id: true },
      }))
    )
      return null;
    if (
      !(await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true },
      }))
    )
      return null;
    return prisma.topic.create({
      data: {
        subjectId,
        parentId: input.parentTopicId,
        name: input.name,
        slug: slug(input.name),
        description: nullable(input.description),
        position: input.position,
      },
      select: { id: true, parentId: true, name: true },
    });
  },
  async createSyllabus(examinationId, input) {
    const [examination, notice, position, specialization] = await Promise.all([
      prisma.examination.findUnique({
        where: { id: examinationId },
        select: { id: true },
      }),
      input.noticeId
        ? prisma.notice.findFirst({
            where: { id: input.noticeId, examinationId },
            select: { id: true },
          })
        : true,
      input.positionId
        ? prisma.position.findFirst({
            where: { id: input.positionId, examinationId },
            select: { id: true },
          })
        : true,
      input.specializationId
        ? prisma.specialization.findFirst({
            where: {
              id: input.specializationId,
              position: {
                examinationId,
                ...(input.positionId ? { id: input.positionId } : {}),
              },
            },
            select: { id: true, positionId: true },
          })
        : true,
    ]);
    if (!examination || !notice || !position || !specialization) return null;
    return prisma.$transaction(async (tx) => {
      const syllabus = await tx.syllabus.create({
        data: {
          examinationId,
          noticeId: input.noticeId,
          positionId:
            input.positionId ??
            (typeof specialization === "object"
              ? specialization.positionId
              : null),
          specializationId: input.specializationId,
          title: input.title,
          status: input.status,
        },
        select: { id: true, title: true, status: true },
      });
      async function addItems(
        items: typeof input.items,
        parentItemId: string | null,
      ) {
        for (const item of items) {
          const created = await tx.syllabusItem.create({
            data: {
              syllabusId: syllabus.id,
              parentItemId,
              title: item.title,
              description: nullable(item.description),
              subjectId: item.subjectId,
              topicId: item.topicId,
              order: item.order,
              weight: item.weight,
              numberOfQuestions: item.numberOfQuestions,
            },
            select: { id: true },
          });
          await addItems(item.children, created.id);
        }
      }
      await addItems(input.items, null);
      return syllabus;
    });
  },
  async linkObjective(actorId, objectiveId, input) {
    const objective = await prisma.objective.findFirst({
      where: { id: objectiveId, ownerId: actorId },
      select: { id: true },
    });
    if (!objective) return "not_found";
    if (
      input.examinationId &&
      !(await prisma.examination.findFirst({
        where: { id: input.examinationId, publicationStatus: "PUBLISHED" },
        select: { id: true },
      }))
    )
      return "invalid";
    for (const selection of input.selections) {
      const valid = await prisma.position.findFirst({
        where: {
          id: selection.positionId,
          examinationId: input.examinationId ?? undefined,
          ...(selection.specializationId
            ? { specializations: { some: { id: selection.specializationId } } }
            : {}),
        },
        select: { id: true },
      });
      if (!valid) return "invalid";
    }
    await prisma.$transaction(async (tx) => {
      await tx.objective.updateMany({
        where: { id: objectiveId, ownerId: actorId },
        data: { examinationId: input.examinationId },
      });
      await tx.objectivePosition.deleteMany({ where: { objectiveId } });
      if (input.selections.length)
        await tx.objectivePosition.createMany({
          data: input.selections.map((selection) => ({
            objectiveId,
            positionId: selection.positionId,
            specializationId: selection.specializationId,
          })),
        });
    });
    return "updated";
  },
};
