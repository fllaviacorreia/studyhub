import {
  questionInputSchema,
  questionQuerySchema,
} from "@/domains/learning/schemas";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await learningRepository.listQuestions(
        actor,
        questionQuerySchema.parse(queryObject(request.url)),
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await learningRepository.createQuestion(
          actor,
          await parseJson(request, questionInputSchema),
        ),
      },
      { status: 201 },
    );
  });
}
