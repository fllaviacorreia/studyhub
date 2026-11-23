import { createPlanSchema, planListSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await planningRepository.listPlans(
        actor.id,
        planListSchema.parse(queryObject(request.url)),
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await planningRepository.createPlan(
          actor.id,
          await parseJson(request, createPlanSchema),
        ),
      },
      { status: 201 },
    );
  });
}
