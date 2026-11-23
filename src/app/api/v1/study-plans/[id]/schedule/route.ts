import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi } from "../../../_lib/http";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await planningRepository.schedule(actor.id, (await params).id),
    );
  });
}
