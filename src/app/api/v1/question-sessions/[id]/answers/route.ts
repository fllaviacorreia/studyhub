import { answerSchema } from "@/domains/learning/schemas";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json(
      {
        data: await learningRepository.answerQuestion(
          (await apiActor()).id,
          (await params).id,
          await parseJson(request, answerSchema),
        ),
      },
      { status: 201 },
    ),
  );
}
