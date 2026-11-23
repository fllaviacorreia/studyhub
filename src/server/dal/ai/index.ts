import "server-only";
import { prisma } from "@/server/db/client";
import { AIError } from "@/domains/ai/errors";
import type { Prisma } from "@/generated/prisma/client";

const conversationSelect = {
  id: true,
  title: true,
  studyGoalId: true,
  studyPlanId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIConversationSelect;

async function assertContext(
  userId: string,
  studyGoalId?: string | null,
  studyPlanId?: string | null,
) {
  if (studyGoalId) {
    const goal = await prisma.objective.findFirst({
      where: {
        id: studyGoalId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });
    if (!goal)
      throw new AIError(
        "FORBIDDEN",
        "Objetivo indisponível para esta conversa.",
      );
  }
  if (studyPlanId) {
    const plan = await prisma.studyPlan.findFirst({
      where: { id: studyPlanId, ownerId: userId },
      select: { id: true },
    });
    if (!plan)
      throw new AIError("FORBIDDEN", "Plano indisponível para esta conversa.");
  }
}

export const aiRepository = {
  async listConversations(
    userId: string,
    query: { status?: "ACTIVE" | "ARCHIVED"; cursor?: string; limit: number },
  ) {
    const rows = await prisma.aIConversation.findMany({
      where: { userId, status: query.status },
      select: conversationSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return {
      data: rows.slice(0, query.limit),
      page: {
        hasMore: rows.length > query.limit,
        nextCursor:
          rows.length > query.limit
            ? (rows[query.limit - 1]?.id ?? null)
            : null,
      },
    };
  },
  async createConversation(
    userId: string,
    input: {
      title: string;
      studyGoalId?: string | null;
      studyPlanId?: string | null;
    },
  ) {
    await assertContext(userId, input.studyGoalId, input.studyPlanId);
    return prisma.aIConversation.create({
      data: {
        userId,
        title: input.title,
        studyGoalId: input.studyGoalId,
        studyPlanId: input.studyPlanId,
      },
      select: conversationSelect,
    });
  },
  async getConversation(userId: string, id: string) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id, userId },
      select: conversationSelect,
    });
    if (!conversation)
      throw new AIError("NOT_FOUND", "Conversa não encontrada.");
    return conversation;
  },
  async updateConversation(
    userId: string,
    id: string,
    input: {
      title?: string;
      studyGoalId?: string | null;
      studyPlanId?: string | null;
      status?: "ACTIVE" | "ARCHIVED";
    },
  ) {
    await this.getConversation(userId, id);
    await assertContext(userId, input.studyGoalId, input.studyPlanId);
    await prisma.aIConversation.updateMany({
      where: { id, userId },
      data: input,
    });
    return this.getConversation(userId, id);
  },
  async listMessages(userId: string, conversationId: string, limit = 50) {
    await this.getConversation(userId, conversationId);
    return prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: Math.min(limit, 100),
      select: {
        id: true,
        role: true,
        content: true,
        status: true,
        createdAt: true,
        sources: {
          select: {
            id: true,
            sourceType: true,
            sourceId: true,
            sourceVersionId: true,
            title: true,
            sourceUrl: true,
            location: true,
          },
        },
      },
    });
  },
  async recentMessages(userId: string, conversationId: string, limit: number) {
    await this.getConversation(userId, conversationId);
    const rows = await prisma.aIMessage.findMany({
      where: {
        conversationId,
        status: "COMPLETED",
        role: { in: ["USER", "ASSISTANT"] },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: { role: true, content: true },
    });
    return rows.reverse();
  },
  async createMessage(
    conversationId: string,
    role: "USER" | "ASSISTANT",
    content: string,
    status: "PENDING" | "COMPLETED" = "PENDING",
  ) {
    return prisma.aIMessage.create({
      data: { conversationId, role, content, status },
    });
  },
  async completeMessage(
    id: string,
    content: string,
    providerResponseId: string,
    sources: AISource[],
  ) {
    return prisma.aIMessage.update({
      where: { id },
      data: {
        content,
        status: "COMPLETED",
        providerResponseId,
        sources: {
          create: sources.map((source) => ({
            ...source,
            excerpt: source.excerpt.slice(0, 1_000),
          })),
        },
      },
    });
  },
  failMessage(id: string) {
    return prisma.aIMessage.update({
      where: { id },
      data: { status: "FAILED" },
    });
  },
  async checkAllowance(
    userId: string,
    requestsPerDay: number,
    tokensPerDay: number,
  ) {
    const [recent, tokenUsage, active] = await Promise.all([
      prisma.aIUsageRecord.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 86_400_000) },
        },
      }),
      prisma.aIUsageRecord.aggregate({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 86_400_000) },
        },
        _sum: { inputTokens: true, outputTokens: true },
      }),
      prisma.aIMessage.count({
        where: {
          conversation: { userId },
          role: "ASSISTANT",
          status: "PENDING",
        },
      }),
    ]);
    if (recent >= requestsPerDay)
      throw new AIError(
        "RATE_LIMITED",
        "Limite diário do tutor atingido.",
        86_400,
      );
    if (
      (tokenUsage._sum.inputTokens ?? 0) +
        (tokenUsage._sum.outputTokens ?? 0) >=
      tokensPerDay
    )
      throw new AIError(
        "RATE_LIMITED",
        "Cota diária de tokens atingida.",
        86_400,
      );
    if (active > 0)
      throw new AIError(
        "RATE_LIMITED",
        "Já existe uma resposta em geração.",
        5,
      );
  },
  recordUsage(data: {
    userId: string;
    conversationId?: string;
    operation: string;
    model: string;
    status: "SUCCEEDED" | "FAILED" | "CANCELLED";
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
  }) {
    return prisma.aIUsageRecord.create({ data });
  },
  async usage(userId: string, since: Date) {
    const rows = await prisma.aIUsageRecord.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        operation: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        cachedInputTokens: true,
        status: true,
        createdAt: true,
      },
    });
    return {
      records: rows,
      totals: rows.reduce(
        (result, row) => ({
          requests: result.requests + 1,
          inputTokens: result.inputTokens + (row.inputTokens ?? 0),
          outputTokens: result.outputTokens + (row.outputTokens ?? 0),
        }),
        { requests: 0, inputTokens: 0, outputTokens: 0 },
      ),
    };
  },
};

export type AISource = {
  sourceType: string;
  sourceId?: string;
  sourceVersionId?: string;
  title: string;
  sourceUrl?: string;
  location?: string;
  excerpt: string;
};

export async function searchAuthorizedMaterials(
  userId: string,
  query: string,
  limit: number,
  materialIds?: string[],
): Promise<AISource[]> {
  const terms = query
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .filter((term) => term.length >= 3)
    .slice(0, 8);
  const materials = await prisma.material.findMany({
    where: {
      ...(materialIds?.length ? { id: { in: materialIds } } : {}),
      OR: [
        { authorId: userId },
        { visibility: "PUBLIC", status: "PUBLISHED" },
        {
          visibility: "SHARED",
          status: "PUBLISHED",
          accesses: { some: { userId } },
        },
      ],
      ...(terms.length
        ? {
            AND: [
              {
                OR: terms.flatMap((term) => [
                  { title: { contains: term, mode: "insensitive" as const } },
                  { summary: { contains: term, mode: "insensitive" as const } },
                  {
                    versions: {
                      some: {
                        content: {
                          contains: term,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  },
                ]),
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      currentVersion: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { id: true, version: true, content: true },
      },
    },
    take: limit,
  });
  return materials.flatMap((material) =>
    material.versions.map((version) => ({
      sourceType: "LEARNING_MATERIAL",
      sourceId: material.id,
      sourceVersionId: version.id,
      title: material.title,
      sourceUrl: material.sourceUrl ?? undefined,
      location: `Versão ${version.version}`,
      excerpt: (version.content ?? "").slice(0, 2_500),
    })),
  );
}
