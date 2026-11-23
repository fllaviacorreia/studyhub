import "server-only";

import {
  correctAnswer,
  validatePublishedQuestion,
} from "@/domains/learning/correction";
import { LearningError } from "@/domains/learning/errors";
import type {
  MaterialInput,
  MaterialUpdateInput,
  QuestionInput,
  QuestionUpdateInput,
} from "@/domains/learning/schemas";
import type { SessionActor } from "./session";
import { prisma } from "@/server/db/client";
import type { Prisma } from "@/generated/prisma/client";

const canEdit = (actor: SessionActor) =>
  actor.role === "CURATOR" || actor.role === "ADMIN";
const requireEditor = (actor: SessionActor) => {
  if (!canEdit(actor))
    throw new LearningError(
      "FORBIDDEN",
      "Seu perfil não possui permissão editorial.",
    );
};
const slugify = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const page = <T extends { id: string }>(items: T[], limit: number) => ({
  data: items.slice(0, limit),
  page: {
    hasMore: items.length > limit,
    nextCursor: items.length > limit ? (items[limit - 1]?.id ?? null) : null,
  },
});
const materialAccess = (actor: SessionActor): Prisma.MaterialWhereInput =>
  canEdit(actor)
    ? {}
    : {
        OR: [
          { status: "PUBLISHED", visibility: { in: ["PUBLIC", "SHARED"] } },
          { authorId: actor.id },
        ],
      };
const questionAccess = (actor: SessionActor): Prisma.QuestionWhereInput =>
  canEdit(actor)
    ? {}
    : {
        OR: [
          { status: "PUBLISHED", visibility: { in: ["PUBLIC", "SHARED"] } },
          { authorId: actor.id },
        ],
      };

export const learningRepository = {
  async listMaterials(
    actor: SessionActor,
    query: {
      cursor?: string;
      limit: number;
      search?: string;
      subjectId?: string;
      topicId?: string;
      kind?: MaterialInput["kind"];
      progressStatus?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    },
  ) {
    const items = await prisma.material.findMany({
      where: {
        AND: [
          materialAccess(actor),
          ...(query.search
            ? [
                {
                  OR: [
                    {
                      title: {
                        contains: query.search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      summary: {
                        contains: query.search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
        kind: query.kind,
        topics: query.topicId
          ? { some: { topicId: query.topicId } }
          : query.subjectId
            ? { some: { topic: { subjectId: query.subjectId } } }
            : undefined,
        ...(query.progressStatus
          ? {
              progress: {
                some: { userId: actor.id, status: query.progressStatus },
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        kind: true,
        contentFormat: true,
        estimatedMinutes: true,
        status: true,
        publishedAt: true,
        topics: {
          select: {
            isPrimary: true,
            topic: {
              select: {
                id: true,
                name: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
        progress: {
          where: { userId: actor.id },
          select: {
            status: true,
            progressPercentage: true,
            lastPosition: true,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getMaterial(actor: SessionActor, id: string) {
    return prisma.material.findFirst({
      where: { id, ...materialAccess(actor) },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        kind: true,
        contentFormat: true,
        status: true,
        visibility: true,
        estimatedMinutes: true,
        publishedAt: true,
        currentVersion: true,
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { version: true, content: true },
        },
        topics: {
          select: {
            isPrimary: true,
            topic: {
              select: {
                id: true,
                name: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
        sources: {
          select: {
            id: true,
            title: true,
            sourceType: true,
            sourceUrl: true,
            author: true,
            publicationDate: true,
            description: true,
          },
        },
        progress: {
          where: { userId: actor.id },
          select: {
            status: true,
            progressPercentage: true,
            lastPosition: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });
  },
  async createMaterial(actor: SessionActor, input: MaterialInput) {
    requireEditor(actor);
    const { content, topicIds, primaryTopicId, changeDescription, ...data } =
      input;
    return prisma.material.create({
      data: {
        ...data,
        slug: `${slugify(input.title)}-${crypto.randomUUID().slice(0, 8)}`,
        authorId: actor.id,
        versions: {
          create: {
            version: 1,
            content,
            changeDescription,
            createdById: actor.id,
            aiGenerated: input.provenance === "AI_GENERATED",
          },
        },
        topics: {
          create: [...new Set(topicIds)].map((topicId) => ({
            topicId,
            isPrimary: topicId === primaryTopicId,
          })),
        },
      },
      select: { id: true, title: true, status: true, currentVersion: true },
    });
  },
  async updateMaterial(
    actor: SessionActor,
    id: string,
    input: MaterialUpdateInput,
  ) {
    requireEditor(actor);
    const current = await prisma.material.findUnique({
      where: { id },
      select: { currentVersion: true, status: true },
    });
    if (!current)
      throw new LearningError("NOT_FOUND", "Material não encontrado.");
    const { content, topicIds, primaryTopicId, changeDescription, ...data } =
      input;
    return prisma.$transaction(async (tx) => {
      if (topicIds) {
        await tx.materialTopic.deleteMany({ where: { materialId: id } });
        await tx.materialTopic.createMany({
          data: [...new Set(topicIds)].map((topicId) => ({
            materialId: id,
            topicId,
            isPrimary: topicId === primaryTopicId,
          })),
        });
      }
      const version = content
        ? current.currentVersion + 1
        : current.currentVersion;
      if (content)
        await tx.materialVersion.create({
          data: {
            materialId: id,
            version,
            content,
            changeDescription,
            createdById: actor.id,
            aiGenerated: input.provenance === "AI_GENERATED",
          },
        });
      return tx.material.update({
        where: { id },
        data: {
          ...data,
          ...(input.title
            ? { slug: `${slugify(input.title)}-${id.slice(0, 8)}` }
            : {}),
          currentVersion: version,
          ...(current.status === "PUBLISHED" && content
            ? { status: "IN_REVIEW", publishedAt: null }
            : {}),
        },
        select: { id: true, title: true, status: true, currentVersion: true },
      });
    });
  },
  async publishMaterial(actor: SessionActor, id: string) {
    requireEditor(actor);
    const material = await prisma.material.findUnique({
      where: { id },
      select: {
        title: true,
        versions: { where: { content: { not: null } }, take: 1 },
      },
    });
    if (!material)
      throw new LearningError("NOT_FOUND", "Material não encontrado.");
    if (!material.title.trim() || !material.versions.length)
      throw new LearningError(
        "INVALID_DEPENDENCY",
        "Título e conteúdo são obrigatórios para publicação.",
      );
    return prisma.material.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      select: { id: true, status: true, publishedAt: true },
    });
  },
  async archiveMaterial(actor: SessionActor, id: string) {
    requireEditor(actor);
    try {
      return await prisma.material.update({
        where: { id },
        data: { status: "ARCHIVED" },
        select: { id: true, status: true },
      });
    } catch {
      throw new LearningError("NOT_FOUND", "Material não encontrado.");
    }
  },
  listMaterialVersions(actor: SessionActor, id: string) {
    requireEditor(actor);
    return prisma.materialVersion.findMany({
      where: { materialId: id },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        content: true,
        changeDescription: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
  },
  listProgress(userId: string) {
    return prisma.learningProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        materialId: true,
        status: true,
        progressPercentage: true,
        lastPosition: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
      },
    });
  },
  async updateProgress(
    userId: string,
    materialId: string,
    input: {
      progressPercentage: number;
      lastPosition?: string | null;
      completed?: boolean;
    },
  ) {
    const exists = await prisma.material.findFirst({
      where: { id: materialId, status: { in: ["PUBLISHED", "ARCHIVED"] } },
      select: { id: true },
    });
    if (!exists)
      throw new LearningError("NOT_FOUND", "Material não encontrado.");
    const completed =
      input.completed === true || input.progressPercentage === 100;
    const percentage = completed ? 100 : input.progressPercentage;
    return prisma.learningProgress.upsert({
      where: { userId_materialId: { userId, materialId } },
      create: {
        userId,
        materialId,
        progressPercentage: percentage,
        lastPosition: input.lastPosition,
        status: completed
          ? "COMPLETED"
          : percentage > 0
            ? "IN_PROGRESS"
            : "NOT_STARTED",
        startedAt: percentage > 0 ? new Date() : null,
        completedAt: completed ? new Date() : null,
      },
      update: {
        progressPercentage: percentage,
        lastPosition: input.lastPosition,
        status: completed
          ? "COMPLETED"
          : percentage > 0
            ? "IN_PROGRESS"
            : "NOT_STARTED",
        startedAt: percentage > 0 ? { set: new Date() } : undefined,
        completedAt: completed ? new Date() : null,
      },
      select: {
        materialId: true,
        status: true,
        progressPercentage: true,
        lastPosition: true,
        startedAt: true,
        completedAt: true,
      },
    });
  },

  async listQuestions(
    actor: SessionActor,
    query: {
      cursor?: string;
      limit: number;
      subjectId?: string;
      topicId?: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      boardId?: string;
      year?: number;
      provenance?: QuestionInput["provenance"];
    },
  ) {
    const items = await prisma.question.findMany({
      where: {
        ...questionAccess(actor),
        difficulty: query.difficulty,
        boardId: query.boardId,
        year: query.year,
        provenance: query.provenance,
        topics: query.topicId
          ? { some: { topicId: query.topicId } }
          : query.subjectId
            ? { some: { topic: { subjectId: query.subjectId } } }
            : undefined,
      },
      select: {
        id: true,
        statement: true,
        kind: true,
        difficulty: true,
        provenance: true,
        status: true,
        year: true,
        board: { select: { id: true, name: true, acronym: true } },
        topics: {
          select: {
            isPrimary: true,
            topic: {
              select: {
                id: true,
                name: true,
                subject: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  getQuestion(actor: SessionActor, id: string) {
    return prisma.question.findFirst({
      where: { id, ...questionAccess(actor) },
      select: {
        id: true,
        statement: true,
        kind: true,
        difficulty: true,
        provenance: true,
        status: true,
        year: true,
        sourceLabel: true,
        options: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            label: true,
            text: true,
            position: true,
            ...(canEdit(actor) ? { isCorrect: true } : {}),
          },
        },
        topics: {
          select: {
            isPrimary: true,
            topic: { select: { id: true, name: true } },
          },
        },
      },
    });
  },
  async createQuestion(actor: SessionActor, input: QuestionInput) {
    requireEditor(actor);
    validatePublishedQuestion({
      kind: input.kind,
      options: input.options.map((option) => ({
        id: option.label,
        isCorrect: option.isCorrect,
      })),
    });
    const { options, topicIds, primaryTopicId, ...data } = input;
    return prisma.question.create({
      data: {
        ...data,
        authorId: actor.id,
        options: {
          create: options.map(({ content, order, ...option }) => ({
            ...option,
            text: content,
            position: order,
          })),
        },
        topics: {
          create: [...new Set(topicIds)].map((topicId) => ({
            topicId,
            isPrimary: topicId === primaryTopicId,
          })),
        },
      },
      select: { id: true, status: true, statement: true },
    });
  },
  async updateQuestion(
    actor: SessionActor,
    id: string,
    input: QuestionUpdateInput,
  ) {
    requireEditor(actor);
    const current = await prisma.question.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current)
      throw new LearningError("NOT_FOUND", "Questão não encontrada.");
    if (input.options && input.kind)
      validatePublishedQuestion({
        kind: input.kind,
        options: input.options.map((option) => ({
          id: option.label,
          isCorrect: option.isCorrect,
        })),
      });
    const { options, topicIds, primaryTopicId, ...data } = input;
    return prisma.$transaction(async (tx) => {
      if (options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: options.map(({ content, order, ...option }) => ({
            ...option,
            questionId: id,
            text: content,
            position: order,
          })),
        });
      }
      if (topicIds) {
        await tx.questionTopic.deleteMany({ where: { questionId: id } });
        await tx.questionTopic.createMany({
          data: [...new Set(topicIds)].map((topicId) => ({
            questionId: id,
            topicId,
            isPrimary: topicId === primaryTopicId,
          })),
        });
      }
      return tx.question.update({
        where: { id },
        data: {
          ...data,
          ...(current.status === "PUBLISHED"
            ? { status: "IN_REVIEW", publishedAt: null }
            : {}),
        },
        select: { id: true, status: true },
      });
    });
  },
  async publishQuestion(actor: SessionActor, id: string) {
    requireEditor(actor);
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({
        where: { id },
        include: { options: { orderBy: { position: "asc" } } },
      });
      if (!question)
        throw new LearningError("NOT_FOUND", "Questão não encontrada.");
      validatePublishedQuestion(question);
      if (
        question.provenance === "OFFICIAL" &&
        !question.sourceUrl &&
        !question.sourceLabel
      )
        throw new LearningError(
          "INVALID_DEPENDENCY",
          "Questões oficiais exigem uma origem verificável.",
        );
      const version = question.currentVersion + 1;
      await tx.questionVersion.create({
        data: {
          questionId: id,
          version,
          kind: question.kind,
          statement: question.statement,
          explanation: question.explanation,
          options: question.options.map((o) => ({
            id: o.id,
            label: o.label,
            content: o.text,
            order: o.position,
            isCorrect: o.isCorrect,
          })),
          createdById: actor.id,
        },
      });
      return tx.question.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          visibility:
            question.visibility === "PRIVATE" ? "SHARED" : question.visibility,
          publishedAt: new Date(),
          currentVersion: version,
        },
        select: {
          id: true,
          status: true,
          currentVersion: true,
          publishedAt: true,
        },
      });
    });
  },
  async archiveQuestion(actor: SessionActor, id: string) {
    requireEditor(actor);
    try {
      return await prisma.question.update({
        where: { id },
        data: { status: "ARCHIVED" },
        select: { id: true, status: true },
      });
    } catch {
      throw new LearningError("NOT_FOUND", "Questão não encontrada.");
    }
  },

  listExerciseLists(userId: string, query: { cursor?: string; limit: number }) {
    return prisma.exerciseList
      .findMany({
        where: { OR: [{ userId }, { userId: null, status: "PUBLISHED" }] },
        select: {
          id: true,
          title: true,
          description: true,
          mode: true,
          status: true,
          createdAt: true,
          _count: { select: { questions: true, sessions: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: query.limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      })
      .then((items) => page(items, query.limit));
  },
  async createExerciseList(
    userId: string,
    input: {
      title: string;
      description?: string | null;
      mode: "PRACTICE" | "EXAM";
      questionIds: string[];
    },
  ) {
    const questionIds = [...new Set(input.questionIds)];
    const count = await prisma.question.count({
      where: { id: { in: questionIds }, status: "PUBLISHED" },
    });
    if (count !== questionIds.length)
      throw new LearningError(
        "INVALID_DEPENDENCY",
        "A lista contém questões indisponíveis.",
      );
    return prisma.exerciseList.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        mode: input.mode,
        questions: {
          create: questionIds.map((questionId, position) => ({
            questionId,
            position,
          })),
        },
      },
      select: { id: true, title: true, mode: true, status: true },
    });
  },
  getExerciseList(userId: string, id: string) {
    return prisma.exerciseList.findFirst({
      where: { id, OR: [{ userId }, { userId: null, status: "PUBLISHED" }] },
      select: {
        id: true,
        title: true,
        description: true,
        mode: true,
        status: true,
        questions: {
          orderBy: { position: "asc" },
          select: {
            position: true,
            question: {
              select: {
                id: true,
                statement: true,
                kind: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });
  },
  async deleteExerciseList(userId: string, id: string) {
    const result = await prisma.exerciseList.deleteMany({
      where: { id, userId, sessions: { none: {} } },
    });
    if (!result.count)
      throw new LearningError(
        "CONFLICT",
        "A lista não existe, não pertence a você ou já possui histórico.",
      );
  },

  async startQuestionSession(
    userId: string,
    input: {
      exerciseListId: string;
      studyTaskId?: string | null;
      studySessionId?: string | null;
      idempotencyKey: string;
    },
  ) {
    const existing = await prisma.questionSession.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey },
      },
      select: { id: true, status: true, mode: true, totalQuestions: true },
    });
    if (existing) return existing;
    const list = await prisma.exerciseList.findFirst({
      where: {
        id: input.exerciseListId,
        OR: [{ userId }, { userId: null, status: "PUBLISHED" }],
      },
      include: {
        questions: {
          orderBy: { position: "asc" },
          include: {
            question: {
              select: {
                id: true,
                currentVersion: true,
                status: true,
                versions: {
                  orderBy: { version: "desc" },
                  take: 1,
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
    if (
      !list ||
      list.questions.some(
        (item) =>
          item.question.status !== "PUBLISHED" || !item.question.versions[0],
      )
    )
      throw new LearningError(
        "INVALID_DEPENDENCY",
        "A lista não está disponível para resolução.",
      );
    if (
      input.studyTaskId &&
      !(await prisma.planTask.findFirst({
        where: {
          id: input.studyTaskId,
          plan: { ownerId: userId },
          activityType: "PRACTICE",
        },
        select: { id: true },
      }))
    )
      throw new LearningError(
        "FORBIDDEN",
        "A atividade prática não pertence a você.",
      );
    if (
      input.studySessionId &&
      !(await prisma.studySession.findFirst({
        where: { id: input.studySessionId, userId },
        select: { id: true },
      }))
    )
      throw new LearningError(
        "FORBIDDEN",
        "A sessão de estudo não pertence a você.",
      );
    return prisma.questionSession.create({
      data: {
        userId,
        exerciseListId: list.id,
        studyTaskId: input.studyTaskId,
        studySessionId: input.studySessionId,
        idempotencyKey: input.idempotencyKey,
        mode: list.mode,
        totalQuestions: list.questions.length,
        items: {
          create: list.questions.map((item) => ({
            questionId: item.questionId,
            questionVersionId: item.question.versions[0]!.id,
            position: item.position,
          })),
        },
      },
      select: { id: true, status: true, mode: true, totalQuestions: true },
    });
  },
  async getQuestionSession(userId: string, id: string) {
    const session = await prisma.questionSession.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        mode: true,
        startedAt: true,
        finishedAt: true,
        totalQuestions: true,
        correctAnswers: true,
        items: {
          orderBy: { position: "asc" },
          select: {
            position: true,
            questionId: true,
            questionVersion: {
              select: { kind: true, statement: true, options: true },
            },
          },
        },
        attempts: {
          select: {
            questionId: true,
            selectedOptionIds: true,
            isCorrect: true,
          },
        },
      },
    });
    if (!session)
      throw new LearningError(
        "NOT_FOUND",
        "Sessão de questões não encontrada.",
      );
    return {
      ...session,
      correctAnswers:
        session.status === "COMPLETED" || session.mode === "PRACTICE"
          ? session.correctAnswers
          : undefined,
      items: session.items.map((item) => ({
        ...item,
        questionVersion: {
          ...item.questionVersion,
          options: (
            item.questionVersion.options as Array<Record<string, unknown>>
          ).map((option) =>
            Object.fromEntries(
              Object.entries(option).filter(([key]) => key !== "isCorrect"),
            ),
          ),
        },
      })),
      attempts: session.attempts.map((attempt) => ({
        questionId: attempt.questionId,
        selectedOptionIds: attempt.selectedOptionIds,
        ...(session.mode === "PRACTICE" || session.status === "COMPLETED"
          ? { isCorrect: attempt.isCorrect }
          : {}),
      })),
    };
  },
  async answerQuestion(
    userId: string,
    sessionId: string,
    input: {
      questionId: string;
      selectedOptionIds: string[];
      responseTimeSeconds?: number | null;
      idempotencyKey: string;
    },
  ) {
    const existing = await prisma.questionAttempt.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey },
      },
      select: { id: true, isCorrect: true, questionId: true },
    });
    if (existing) return existing;
    return prisma.$transaction(async (tx) => {
      const session = await tx.questionSession.findFirst({
        where: { id: sessionId, userId, status: "IN_PROGRESS" },
        select: {
          mode: true,
          studySessionId: true,
          items: {
            where: { questionId: input.questionId },
            select: {
              questionVersionId: true,
              questionVersion: {
                select: { kind: true, explanation: true, options: true },
              },
            },
          },
        },
      });
      const item = session?.items[0];
      if (!session || !item)
        throw new LearningError(
          "INVALID_ANSWER",
          "A questão não pertence a uma sessão em andamento.",
        );
      const options = item.questionVersion.options as Array<{
        id: string;
        isCorrect: boolean;
      }>;
      const isCorrect = correctAnswer(
        { kind: item.questionVersion.kind, options },
        input.selectedOptionIds,
      );
      const attempt = await tx.questionAttempt.create({
        data: {
          userId,
          questionSessionId: sessionId,
          questionId: input.questionId,
          questionVersionId: item.questionVersionId,
          sessionId: session.studySessionId,
          selectedOptionIds: input.selectedOptionIds,
          isCorrect,
          responseTimeMs:
            input.responseTimeSeconds == null
              ? null
              : input.responseTimeSeconds * 1000,
          idempotencyKey: input.idempotencyKey,
          explanationRevealed: session.mode === "PRACTICE",
        },
        select: { id: true, questionId: true, isCorrect: true },
      });
      return session.mode === "PRACTICE"
        ? {
            ...attempt,
            explanation: item.questionVersion.explanation,
            correctOptionIds: options
              .filter((o) => o.isCorrect)
              .map((o) => o.id),
          }
        : { id: attempt.id, questionId: attempt.questionId, accepted: true };
    });
  },
  async finishQuestionSession(userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.questionSession.findFirst({
        where: { id, userId },
        select: {
          status: true,
          totalQuestions: true,
          attempts: { select: { isCorrect: true } },
        },
      });
      if (!session)
        throw new LearningError(
          "NOT_FOUND",
          "Sessão de questões não encontrada.",
        );
      if (session.status === "COMPLETED")
        return tx.questionSession.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            totalQuestions: true,
            correctAnswers: true,
            finishedAt: true,
          },
        });
      const correctAnswers = session.attempts.filter((a) => a.isCorrect).length;
      return tx.questionSession.update({
        where: { id },
        data: { status: "COMPLETED", finishedAt: new Date(), correctAnswers },
        select: {
          id: true,
          status: true,
          totalQuestions: true,
          correctAnswers: true,
          finishedAt: true,
        },
      });
    });
  },
  async getResults(userId: string, id: string) {
    const session = await prisma.questionSession.findFirst({
      where: { id, userId, status: "COMPLETED" },
      select: {
        id: true,
        mode: true,
        totalQuestions: true,
        correctAnswers: true,
        finishedAt: true,
        attempts: {
          orderBy: { answeredAt: "asc" },
          select: {
            questionId: true,
            selectedOptionIds: true,
            isCorrect: true,
            responseTimeMs: true,
            questionVersion: {
              select: { statement: true, explanation: true, options: true },
            },
          },
        },
      },
    });
    if (!session)
      throw new LearningError("NOT_FOUND", "Resultado ainda não disponível.");
    return {
      ...session,
      attempts: session.attempts.map((a) => ({
        ...a,
        correctOptionIds: (
          a.questionVersion.options as Array<{ id: string; isCorrect: boolean }>
        )
          .filter((o) => o.isCorrect)
          .map((o) => o.id),
        questionVersion: {
          statement: a.questionVersion.statement,
          explanation: a.questionVersion.explanation,
        },
      })),
    };
  },
  async performance(userId: string) {
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId },
      select: {
        isCorrect: true,
        responseTimeMs: true,
        answeredAt: true,
        questionId: true,
        questionSessionId: true,
        question: {
          select: {
            difficulty: true,
            board: { select: { id: true, name: true } },
            topics: {
              select: {
                topic: {
                  select: {
                    id: true,
                    name: true,
                    subject: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { answeredAt: "asc" },
    });
    const total = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;
    const timed = attempts.filter((a) => a.responseTimeMs != null);
    const summarize = <T extends { isCorrect: boolean }>(rows: T[]) => ({
      total: rows.length,
      correct: rows.filter((r) => r.isCorrect).length,
      accuracyPercentage: rows.length
        ? Math.round(
            (rows.filter((r) => r.isCorrect).length / rows.length) * 10000,
          ) / 100
        : 0,
    });
    const group = <T extends { id: string; name: string }>(
      entries: Array<{ key: T; attempt: { isCorrect: boolean } }>,
    ) =>
      [...new Map(entries.map(({ key }) => [key.id, key])).values()].map(
        (key) => ({
          ...key,
          ...summarize(
            entries.filter((e) => e.key.id === key.id).map((e) => e.attempt),
          ),
        }),
      );
    return {
      overview: {
        totalAttempts: total,
        uniqueQuestions: new Set(attempts.map((a) => a.questionId)).size,
        correctAnswers: correct,
        incorrectAnswers: total - correct,
        accuracyPercentage: total
          ? Math.round((correct / total) * 10000) / 100
          : 0,
        averageTimeSeconds:
          timed.reduce((sum, a) => sum + (a.responseTimeMs ?? 0), 0) /
          Math.max(1, timed.length) /
          1000,
      },
      subjects: group(
        attempts.flatMap((attempt) =>
          attempt.question.topics.map(({ topic }) => ({
            key: topic.subject,
            attempt,
          })),
        ),
      ),
      topics: group(
        attempts.flatMap((attempt) =>
          attempt.question.topics.map(({ topic }) => ({
            key: { id: topic.id, name: topic.name },
            attempt,
          })),
        ),
      ),
      difficulty: (["EASY", "MEDIUM", "HARD"] as const).map((difficulty) => ({
        difficulty,
        ...summarize(
          attempts.filter((a) => a.question.difficulty === difficulty),
        ),
      })),
      boards: group(
        attempts
          .filter((a) => a.question.board)
          .map((attempt) => ({ key: attempt.question.board!, attempt })),
      ),
      history: attempts.map((a) => ({
        answeredAt: a.answeredAt,
        isCorrect: a.isCorrect,
        questionId: a.questionId,
        questionSessionId: a.questionSessionId,
      })),
    };
  },
};
