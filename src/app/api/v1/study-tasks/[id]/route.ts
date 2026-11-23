import { updateTaskSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json({
      data: await planningRepository.updateTask(
        actor.id,
        (await params).id,
        await parseJson(request, updateTaskSchema),
      ),
    });
  });
}
export async function DELETE(_: Request, { params }: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    await planningRepository.cancelTask(actor.id, (await params).id);
    return new Response(null, { status: 204 });
  });
}
