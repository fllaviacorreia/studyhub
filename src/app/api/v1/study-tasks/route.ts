import { taskListSchema, taskSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await planningRepository.listTasks(
        actor.id,
        taskListSchema.parse(queryObject(request.url)),
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await planningRepository.createTask(
          actor.id,
          await parseJson(request, taskSchema),
        ),
      },
      { status: 201 },
    );
  });
}
