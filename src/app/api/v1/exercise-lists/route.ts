import {
  exerciseListInputSchema,
  pageSchema,
} from "@/domains/learning/schemas";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await learningRepository.listExerciseLists(
        actor.id,
        pageSchema.parse(queryObject(request.url)),
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await learningRepository.createExerciseList(
          actor.id,
          await parseJson(request, exerciseListInputSchema),
        ),
      },
      { status: 201 },
    );
  });
}
