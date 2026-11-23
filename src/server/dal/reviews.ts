import "server-only";

import { scheduleReview, type ReviewRating } from "@/domains/reviews/scheduler";
import { rankWeakTopics } from "@/domains/reviews/performance";
import { ReviewError } from "@/domains/reviews/errors";
import { prisma } from "@/server/db/client";

const page = <T>(items: T[], limit: number) => ({
  items: items.slice(0, limit),
  nextCursor:
    items.length > limit ? (items[limit - 1] as { id: string }).id : null,
});

export const reviewRepository = {
  async list(
    userId: string,
    query: {
      cursor?: string;
      limit: number;
      status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
      subjectId?: string;
      topicId?: string;
      days?: number;
    },
  ) {
    const until =
      query.days == null
        ? undefined
        : new Date(Date.now() + query.days * 86_400_000);
    const items = await prisma.reviewSchedule.findMany({
      where: {
        userId,
        status: query.status,
        topicId: query.topicId,
        nextReviewAt: until ? { lte: until } : undefined,
        topic: query.subjectId ? { subjectId: query.subjectId } : undefined,
      },
      select: {
        id: true,
        status: true,
        nextReviewAt: true,
        lastReviewedAt: true,
        reviewCount: true,
        lapseCount: true,
        intervalDays: true,
        topic: {
          select: {
            id: true,
            name: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ nextReviewAt: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  async create(
    userId: string,
    input: { topicId: string; firstReviewAt?: string },
  ) {
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
      select: { id: true },
    });
    if (!topic) throw new ReviewError("NOT_FOUND", "Assunto não encontrado.");
    return prisma.reviewSchedule.upsert({
      where: { userId_topicId: { userId, topicId: input.topicId } },
      create: {
        userId,
        topicId: input.topicId,
        nextReviewAt: input.firstReviewAt
          ? new Date(input.firstReviewAt)
          : new Date(),
      },
      update: {},
      select: {
        id: true,
        status: true,
        nextReviewAt: true,
        intervalDays: true,
      },
    });
  },
  async update(
    userId: string,
    id: string,
    status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED",
  ) {
    const result = await prisma.reviewSchedule.updateMany({
      where: { id, userId },
      data: { status },
    });
    if (!result.count)
      throw new ReviewError("NOT_FOUND", "Revisão não encontrada.");
    return prisma.reviewSchedule.findUnique({
      where: { id },
      select: { id: true, status: true, nextReviewAt: true },
    });
  },
  async complete(
    userId: string,
    id: string,
    input: {
      rating: ReviewRating;
      responseTimeSeconds?: number;
      notes?: string;
      idempotencyKey: string;
    },
  ) {
    const existing = await prisma.reviewAttempt.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey },
      },
      select: {
        id: true,
        rating: true,
        reviewedAt: true,
        nextIntervalDays: true,
      },
    });
    if (existing) return existing;
    return prisma.$transaction(async (tx) => {
      const current = await tx.reviewSchedule.findFirst({
        where: { id, userId, status: "ACTIVE" },
      });
      if (!current)
        throw new ReviewError(
          "INVALID_STATE",
          "A revisão não existe ou não está ativa.",
        );
      const reviewedAt = new Date();
      const result = scheduleReview(
        {
          intervalDays: current.intervalDays,
          reviewCount: current.reviewCount,
          lapseCount: current.lapseCount,
          stability: Number(current.stability),
          difficulty: Number(current.difficulty),
          nextReviewAt: current.nextReviewAt,
        },
        input.rating,
        reviewedAt,
      );
      const attempt = await tx.reviewAttempt.create({
        data: {
          reviewScheduleId: id,
          userId,
          rating: input.rating,
          reviewedAt,
          previousIntervalDays: current.intervalDays,
          nextIntervalDays: result.intervalDays,
          responseTimeSeconds: input.responseTimeSeconds,
          notes: input.notes,
          idempotencyKey: input.idempotencyKey,
        },
        select: {
          id: true,
          rating: true,
          reviewedAt: true,
          nextIntervalDays: true,
        },
      });
      await tx.reviewSchedule.update({
        where: { id },
        data: {
          nextReviewAt: result.nextReviewAt,
          lastReviewedAt: reviewedAt,
          intervalDays: result.intervalDays,
          reviewCount: result.reviewCount,
          lapseCount: result.lapseCount,
          stability: result.stability,
          difficulty: result.difficulty,
        },
      });
      return attempt;
    });
  },
  async history(userId: string, id: string) {
    const schedule = await prisma.reviewSchedule.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!schedule)
      throw new ReviewError("NOT_FOUND", "Revisão não encontrada.");
    return prisma.reviewAttempt.findMany({
      where: { reviewScheduleId: id, userId },
      orderBy: { reviewedAt: "desc" },
      select: {
        id: true,
        rating: true,
        reviewedAt: true,
        previousIntervalDays: true,
        nextIntervalDays: true,
        responseTimeSeconds: true,
        notes: true,
      },
    });
  },
  async weakTopics(userId: string) {
    const rows = await prisma.questionAttempt.findMany({
      where: { userId },
      select: {
        id: true,
        isCorrect: true,
        answeredAt: true,
        question: { select: { topics: { select: { topicId: true } } } },
      },
    });
    return rankWeakTopics(
      rows.flatMap((row) =>
        row.question.topics.map((topic) => ({
          topicId: topic.topicId,
          isCorrect: row.isCorrect,
          answeredAt: row.answeredAt,
          attemptId: row.id,
        })),
      ),
    );
  },
  async listNotebook(
    userId: string,
    query: {
      cursor?: string;
      limit: number;
      status?: "OPEN" | "REVIEWING" | "RESOLVED" | "ARCHIVED";
      subjectId?: string;
      topicId?: string;
      boardId?: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
    },
  ) {
    const items = await prisma.errorNotebookEntry.findMany({
      where: {
        userId,
        status: query.status,
        topicId: query.topicId,
        question: {
          boardId: query.boardId,
          difficulty: query.difficulty,
          topics: query.subjectId
            ? { some: { topic: { subjectId: query.subjectId } } }
            : undefined,
        },
      },
      select: {
        id: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        question: {
          select: {
            id: true,
            statement: true,
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
        sourceAttempt: {
          select: { id: true, selectedOptionIds: true, answeredAt: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  async getNotebook(userId: string, id: string) {
    const entry = await prisma.errorNotebookEntry.findFirst({
      where: { id, userId },
      include: {
        question: {
          include: {
            attempts: {
              where: { userId },
              orderBy: { answeredAt: "desc" },
              select: {
                id: true,
                isCorrect: true,
                answeredAt: true,
                selectedOptionIds: true,
              },
            },
          },
        },
      },
    });
    if (!entry)
      throw new ReviewError("NOT_FOUND", "Registro do caderno não encontrado.");
    return entry;
  },
  async updateNotebook(
    userId: string,
    id: string,
    input: {
      status?: "OPEN" | "REVIEWING" | "RESOLVED" | "ARCHIVED";
      notes?: string | null;
    },
  ) {
    const result = await prisma.errorNotebookEntry.updateMany({
      where: { id, userId },
      data: {
        ...input,
        resolvedAt:
          input.status === "RESOLVED"
            ? new Date()
            : input.status
              ? null
              : undefined,
      },
    });
    if (!result.count)
      throw new ReviewError("NOT_FOUND", "Registro do caderno não encontrado.");
    return prisma.errorNotebookEntry.findUnique({
      where: { id },
      select: { id: true, status: true, notes: true, resolvedAt: true },
    });
  },
  async retryNotebook(userId: string, id: string, idempotencyKey: string) {
    const entry = await prisma.errorNotebookEntry.findFirst({
      where: { id, userId, question: { status: "PUBLISHED" } },
      select: { questionId: true, question: { select: { statement: true } } },
    });
    if (!entry)
      throw new ReviewError(
        "INVALID_STATE",
        "A questão não está disponível para uma nova tentativa.",
      );
    const list = await prisma.exerciseList.create({
      data: {
        userId,
        title: `Revisão: ${entry.question.statement.slice(0, 120)}`,
        mode: "PRACTICE",
        questions: { create: { questionId: entry.questionId, position: 0 } },
      },
      select: { id: true },
    });
    const { learningRepository } = await import("./learning");
    await prisma.errorNotebookEntry.update({
      where: { id },
      data: { status: "REVIEWING" },
    });
    return learningRepository.startQuestionSession(userId, {
      exerciseListId: list.id,
      idempotencyKey,
    });
  },
};
