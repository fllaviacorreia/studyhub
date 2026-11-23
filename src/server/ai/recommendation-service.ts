import "server-only";
import { prisma } from "@/server/db/client";
import { AIError } from "@/domains/ai/errors";

export const aiRecommendationService = {
  list(userId: string) {
    return prisma.aIRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
  async generate(
    userId: string,
    input: { studyGoalId?: string | null; studyPlanId?: string | null },
  ) {
    if (
      input.studyPlanId &&
      !(await prisma.studyPlan.findFirst({
        where: { id: input.studyPlanId, ownerId: userId },
        select: { id: true },
      }))
    )
      throw new AIError("FORBIDDEN", "Plano não autorizado.");
    const due = await prisma.reviewSchedule.findMany({
      where: { userId, status: "ACTIVE", nextReviewAt: { lte: new Date() } },
      select: { topic: { select: { name: true } } },
      take: 5,
    });
    const title = due.length
      ? "Priorize revisões vencidas"
      : "Mantenha a continuidade do plano";
    const description = due.length
      ? `Revise: ${due.map((item) => item.topic.name).join(", ")}.`
      : "Execute a próxima atividade planejada e registre a sessão.";
    return prisma.aIRecommendation.create({
      data: {
        userId,
        studyGoalId: input.studyGoalId,
        studyPlanId: input.studyPlanId,
        recommendationType: due.length ? "DUE_REVIEWS" : "NEXT_TASK",
        title,
        description,
        rationale: due.length
          ? `${due.length} revisão(ões) estão vencidas.`
          : "Não há revisões vencidas no momento.",
      },
    });
  },
  async decide(userId: string, id: string, status: "ACCEPTED" | "REJECTED") {
    const current = await prisma.aIRecommendation.findFirst({
      where: { id, userId, status: "PENDING" },
      select: { id: true },
    });
    if (!current)
      throw new AIError(
        "INVALID_STATE",
        "Recomendação indisponível ou já decidida.",
      );
    await prisma.aIRecommendation.updateMany({
      where: { id, userId, status: "PENDING" },
      data: { status },
    });
    return prisma.aIRecommendation.findFirst({ where: { id, userId } });
  },
};
