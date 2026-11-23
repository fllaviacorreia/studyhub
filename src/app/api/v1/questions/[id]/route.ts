import { questionUpdateSchema } from "@/domains/learning/schemas";
import { LearningError } from "@/domains/learning/errors";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const data = await learningRepository.getQuestion(
      await apiActor(),
      (await params).id,
    );
    if (!data) throw new LearningError("NOT_FOUND", "Questão não encontrada.");
    return Response.json({ data });
  });
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await learningRepository.updateQuestion(
        await apiActor(),
        (await params).id,
        await parseJson(request, questionUpdateSchema),
      ),
    }),
  );
}
