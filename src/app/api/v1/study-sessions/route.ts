import {
  createSessionSchema,
  sessionListSchema,
} from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await planningRepository.listSessions(
        actor.id,
        sessionListSchema.parse(queryObject(request.url)),
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await planningRepository.createSession(
          actor.id,
          await parseJson(request, createSessionSchema),
        ),
      },
      { status: 201 },
    );
  });
}
