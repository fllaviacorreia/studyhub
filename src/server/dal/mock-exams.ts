import "server-only";

import { MockExamError } from "@/domains/mock-exams/errors";
import { scoreMockExam } from "@/domains/mock-exams/scoring";
import {
  selectQuestions,
  type SelectionFilter,
} from "@/domains/mock-exams/selection";
import { prisma } from "@/server/db/client";
import { learningRepository } from "./learning";

type SectionInput = {
  subjectId?: string | null;
  title: string;
  questionCount: number;
  weight: number;
  order: number;
  filters?: SelectionFilter;
};
type MockInput = {
  title: string;
  description?: string | null;
  studyGoalId?: string | null;
  examinationId?: string | null;
  positionId?: string | null;
  durationMinutes?: number | null;
  totalQuestions: number;
  scoringStrategy: "SIMPLE" | "WEIGHTED_BY_SECTION";
  selectionSeed: string;
  filters: SelectionFilter;
  sections: SectionInput[];
};
const page = <T>(items: T[], limit: number) => ({
  items: items.slice(0, limit),
  nextCursor:
    items.length > limit ? (items[limit - 1] as { id: string }).id : null,
});

export const mockExamRepository = {
  async list(
    userId: string,
    query: {
      cursor?: string;
      limit: number;
      status?: "DRAFT" | "READY" | "ARCHIVED";
    },
  ) {
    const items = await prisma.mockExam.findMany({
      where: { userId, status: query.status },
      select: {
        id: true,
        title: true,
        description: true,
        durationMinutes: true,
        totalQuestions: true,
        status: true,
        scoringStrategy: true,
        createdAt: true,
        _count: { select: { attempts: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return page(items, query.limit);
  },
  async create(userId: string, input: MockInput) {
    if (
      input.studyGoalId &&
      !(await prisma.objective.findFirst({
        where: { id: input.studyGoalId, ownerId: userId },
        select: { id: true },
      }))
    )
      throw new MockExamError("FORBIDDEN", "Objetivo não pertence a você.");
    return prisma.mockExam.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        studyGoalId: input.studyGoalId,
        examinationId: input.examinationId,
        positionId: input.positionId,
        durationMinutes: input.durationMinutes,
        totalQuestions: input.totalQuestions,
        scoringStrategy: input.scoringStrategy,
        selectionSeed: input.selectionSeed,
        selectionFilters: input.filters,
        sections: {
          create: input.sections.map((section) => ({
            ...section,
            filters: section.filters ?? {},
          })),
        },
      },
      select: { id: true, title: true, status: true, totalQuestions: true },
    });
  },
  async get(userId: string, id: string) {
    const exam = await prisma.mockExam.findFirst({
      where: { id, userId },
      include: {
        sections: { orderBy: { order: "asc" } },
        attempts: {
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            status: true,
            startedAt: true,
            finishedAt: true,
            rawScore: true,
            weightedScore: true,
          },
        },
      },
    });
    if (!exam) throw new MockExamError("NOT_FOUND", "Simulado não encontrado.");
    return exam;
  },
  async update(userId: string, id: string, input: Partial<MockInput>) {
    const exam = await prisma.mockExam.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        _count: { select: { attempts: true } },
      },
    });
    if (!exam) throw new MockExamError("NOT_FOUND", "Simulado não encontrado.");
    if (exam._count.attempts && input.sections)
      throw new MockExamError(
        "CONFLICT",
        "A configuração usada por tentativas históricas não pode ser substituída.",
      );
    const { sections, filters, ...data } = input;
    return prisma.$transaction(async (tx) => {
      if (sections) {
        await tx.mockExamSection.deleteMany({ where: { mockExamId: id } });
        await tx.mockExamSection.createMany({
          data: sections.map((section) => ({
            mockExamId: id,
            ...section,
            filters: section.filters ?? {},
          })),
        });
      }
      return tx.mockExam.update({
        where: { id },
        data: { ...data, ...(filters ? { selectionFilters: filters } : {}) },
        select: { id: true, title: true, status: true, totalQuestions: true },
      });
    });
  },
  async archive(userId: string, id: string) {
    const result = await prisma.mockExam.updateMany({
      where: { id, userId },
      data: { status: "ARCHIVED" },
    });
    if (!result.count)
      throw new MockExamError("NOT_FOUND", "Simulado não encontrado.");
  },
  async generate(userId: string, id: string) {
    const exam = await prisma.mockExam.findFirst({
      where: { id, userId, status: { not: "ARCHIVED" } },
      include: { sections: true },
    });
    if (!exam) throw new MockExamError("NOT_FOUND", "Simulado não encontrado.");
    const candidates = await prisma.question.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { visibility: { in: ["PUBLIC", "SHARED"] } },
          { authorId: userId },
        ],
        examinationId: exam.examinationId ?? undefined,
        positionId: exam.positionId ?? undefined,
      },
      select: {
        id: true,
        difficulty: true,
        boardId: true,
        year: true,
        topics: {
          select: { topicId: true, topic: { select: { subjectId: true } } },
        },
      },
    });
    try {
      for (const section of exam.sections)
        selectQuestions(
          candidates.map((q) => ({
            id: q.id,
            difficulty: q.difficulty,
            boardId: q.boardId,
            year: q.year,
            topicIds: q.topics.map((t) => t.topicId),
            subjectIds: [...new Set(q.topics.map((t) => t.topic.subjectId))],
          })),
          section.questionCount,
          `${exam.selectionSeed}:${section.order}`,
          {
            ...(exam.selectionFilters as SelectionFilter),
            ...(section.filters as SelectionFilter),
            subjectId: section.subjectId ?? undefined,
          },
        );
    } catch (error) {
      throw new MockExamError(
        "INSUFFICIENT_QUESTIONS",
        error instanceof Error ? error.message : "Questões insuficientes.",
      );
    }
    return prisma.mockExam.update({
      where: { id },
      data: { status: "READY" },
      select: { id: true, status: true, totalQuestions: true },
    });
  },
  async start(
    userId: string,
    id: string,
    input: {
      idempotencyKey: string;
      studyTaskId?: string | null;
      studySessionId?: string | null;
    },
  ) {
    const existing = await prisma.questionSession.findUnique({
      where: {
        userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey },
      },
      select: {
        mockExamAttempt: {
          select: {
            id: true,
            status: true,
            deadlineAt: true,
            totalQuestions: true,
          },
        },
      },
    });
    if (existing?.mockExamAttempt) return existing.mockExamAttempt;
    const exam = await prisma.mockExam.findFirst({
      where: { id, userId, status: "READY" },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    if (!exam)
      throw new MockExamError(
        "INVALID_STATE",
        "Simulado não existe ou ainda não está pronto.",
      );
    if (
      input.studyTaskId &&
      !(await prisma.planTask.findFirst({
        where: {
          id: input.studyTaskId,
          plan: { ownerId: userId },
          activityType: "SIMULATION",
          OR: [{ mockExamId: id }, { mockExamId: null }],
        },
        select: { id: true },
      }))
    )
      throw new MockExamError(
        "FORBIDDEN",
        "Atividade de simulado não pertence a você.",
      );
    const candidates = await prisma.question.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { visibility: { in: ["PUBLIC", "SHARED"] } },
          { authorId: userId },
        ],
        examinationId: exam.examinationId ?? undefined,
        positionId: exam.positionId ?? undefined,
      },
      select: {
        id: true,
        difficulty: true,
        boardId: true,
        year: true,
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true },
        },
        topics: {
          select: { topicId: true, topic: { select: { subjectId: true } } },
        },
      },
    });
    const selected = exam.sections.flatMap((section) =>
      selectQuestions(
        candidates.map((q) => ({
          id: q.id,
          difficulty: q.difficulty,
          boardId: q.boardId,
          year: q.year,
          topicIds: q.topics.map((t) => t.topicId),
          subjectIds: [...new Set(q.topics.map((t) => t.topic.subjectId))],
        })),
        section.questionCount,
        `${exam.selectionSeed}:${section.order}`,
        {
          ...(exam.selectionFilters as SelectionFilter),
          ...(section.filters as SelectionFilter),
          subjectId: section.subjectId ?? undefined,
        },
      ).map((question) => ({ question, sectionId: section.id })),
    );
    if (
      new Set(selected.map((item) => item.question.id)).size !== selected.length
    )
      throw new MockExamError(
        "INSUFFICIENT_QUESTIONS",
        "As seções selecionaram questões repetidas; ajuste os filtros.",
      );
    const deadlineAt = exam.durationMinutes
      ? new Date(Date.now() + exam.durationMinutes * 60_000)
      : null;
    return prisma.$transaction(async (tx) => {
      const session = await tx.questionSession.create({
        data: {
          userId,
          studyTaskId: input.studyTaskId,
          studySessionId: input.studySessionId,
          idempotencyKey: input.idempotencyKey,
          mode: "EXAM",
          totalQuestions: selected.length,
          items: {
            create: selected.map((item, position) => ({
              questionId: item.question.id,
              questionVersionId: candidates.find(
                (candidate) => candidate.id === item.question.id,
              )!.versions[0]!.id,
              mockExamSectionId: item.sectionId,
              position,
            })),
          },
        },
        select: { id: true },
      });
      return tx.mockExamAttempt.create({
        data: {
          mockExamId: id,
          userId,
          questionSessionId: session.id,
          deadlineAt,
          totalQuestions: selected.length,
        },
        select: {
          id: true,
          status: true,
          deadlineAt: true,
          totalQuestions: true,
        },
      });
    });
  },
  async getAttempt(userId: string, id: string) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        deadlineAt: true,
        totalQuestions: true,
        questionSessionId: true,
      },
    });
    if (!attempt)
      throw new MockExamError("NOT_FOUND", "Tentativa não encontrada.");
    const session = await learningRepository.getQuestionSession(
      userId,
      attempt.questionSessionId,
    );
    return { ...attempt, session };
  },
  async answer(
    userId: string,
    id: string,
    input: {
      questionId: string;
      selectedOptionIds: string[];
      responseTimeSeconds?: number;
      idempotencyKey: string;
    },
  ) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id, userId, status: "IN_PROGRESS" },
      select: { questionSessionId: true, deadlineAt: true },
    });
    if (!attempt)
      throw new MockExamError(
        "INVALID_STATE",
        "Tentativa não está em andamento.",
      );
    if (attempt.deadlineAt && attempt.deadlineAt <= new Date()) {
      await prisma.mockExamAttempt.update({
        where: { id },
        data: { status: "EXPIRED" },
      });
      throw new MockExamError("EXPIRED", "O tempo do simulado terminou.");
    }
    return learningRepository.answerQuestion(
      userId,
      attempt.questionSessionId,
      input,
    );
  },
  async finish(userId: string, id: string) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id, userId },
      include: {
        mockExam: { include: { sections: true } },
        questionSession: {
          include: {
            items: {
              include: {
                question: {
                  select: {
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
                    difficulty: true,
                  },
                },
              },
            },
            attempts: true,
          },
        },
      },
    });
    if (!attempt)
      throw new MockExamError("NOT_FOUND", "Tentativa não encontrada.");
    if (attempt.status === "FINISHED") return attempt;
    if (!(["IN_PROGRESS", "EXPIRED"] as string[]).includes(attempt.status))
      throw new MockExamError(
        "INVALID_STATE",
        "Tentativa não pode ser finalizada.",
      );
    await learningRepository.finishQuestionSession(
      userId,
      attempt.questionSessionId,
    );
    const answerMap = new Map(
      attempt.questionSession.attempts.map((answer) => [
        answer.questionId,
        answer,
      ]),
    );
    const scoredAnswers = attempt.questionSession.items.flatMap((item) =>
      item.mockExamSectionId && answerMap.has(item.questionId)
        ? [
            {
              sectionId: item.mockExamSectionId,
              isCorrect: answerMap.get(item.questionId)!.isCorrect,
            },
          ]
        : [],
    );
    const score = scoreMockExam(
      scoredAnswers,
      attempt.mockExam.sections.map((section) => ({
        id: section.id,
        weight: Number(section.weight),
        questionCount: section.questionCount,
      })),
      attempt.mockExam.scoringStrategy,
    );
    const bySubject = new Map<
      string,
      { id: string; name: string; total: number; correct: number }
    >();
    const byTopic = new Map<
      string,
      { id: string; name: string; total: number; correct: number }
    >();
    for (const item of attempt.questionSession.items)
      for (const { topic } of item.question.topics) {
        const correct = answerMap.get(item.questionId)?.isCorrect ? 1 : 0;
        const subject = bySubject.get(topic.subject.id) ?? {
          ...topic.subject,
          total: 0,
          correct: 0,
        };
        subject.total++;
        subject.correct += correct;
        bySubject.set(subject.id, subject);
        const current = byTopic.get(topic.id) ?? {
          id: topic.id,
          name: topic.name,
          total: 0,
          correct: 0,
        };
        current.total++;
        current.correct += correct;
        byTopic.set(current.id, current);
      }
    const snapshot = {
      ...score,
      unanswered:
        attempt.totalQuestions - attempt.questionSession.attempts.length,
      timeUsedSeconds: Math.max(
        0,
        Math.round(
          ((
            attempt.deadlineAt && attempt.mockExam.durationMinutes
              ? attempt.deadlineAt.getTime() -
                attempt.mockExam.durationMinutes * 60_000
              : attempt.startedAt.getTime()
          )
            ? Date.now() - attempt.startedAt.getTime()
            : 0) / 1000,
        ),
      ),
      bySubject: [...bySubject.values()],
      byTopic: [...byTopic.values()],
    };
    return prisma.mockExamAttempt.update({
      where: { id },
      data: {
        status: "FINISHED",
        submittedAt: new Date(),
        finishedAt: new Date(),
        rawScore: score.rawScore,
        weightedScore: score.weightedScore,
        correctAnswers: score.correctAnswers,
        resultSnapshot: snapshot,
      },
      select: {
        id: true,
        status: true,
        finishedAt: true,
        rawScore: true,
        weightedScore: true,
        correctAnswers: true,
        totalQuestions: true,
        resultSnapshot: true,
      },
    });
  },
  async results(userId: string, id: string) {
    const attempt = await prisma.mockExamAttempt.findFirst({
      where: { id, userId, status: "FINISHED" },
      select: { id: true, resultSnapshot: true, questionSessionId: true },
    });
    if (!attempt)
      throw new MockExamError("NOT_FOUND", "Resultado ainda não disponível.");
    return {
      ...attempt,
      answers: await learningRepository.getResults(
        userId,
        attempt.questionSessionId,
      ),
    };
  },
};
