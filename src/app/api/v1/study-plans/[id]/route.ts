import { updatePlanSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json({
      data: await planningRepository.getPlan(
        actor.id,
        (await context.params).id,
      ),
    });
  });
}
export async function PATCH(request: Request, context: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json({
      data: await planningRepository.updatePlan(
        actor.id,
        (await context.params).id,
        await parseJson(request, updatePlanSchema),
      ),
    });
  });
}
export async function DELETE(_: Request, context: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    await planningRepository.archivePlan(actor.id, (await context.params).id);
    return new Response(null, { status: 204 });
  });
}
