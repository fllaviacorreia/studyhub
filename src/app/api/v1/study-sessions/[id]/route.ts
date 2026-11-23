import { updateSessionSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json({
      data: await planningRepository.updateSession(
        actor.id,
        (await params).id,
        await parseJson(request, updateSessionSchema),
      ),
    });
  });
}
