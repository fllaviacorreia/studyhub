import { startQuestionSessionSchema } from "@/domains/learning/schemas";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson } from "../_lib/http";
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await learningRepository.startQuestionSession(
          actor.id,
          await parseJson(request, startQuestionSessionSchema),
        ),
      },
      { status: 201 },
    );
  });
}
