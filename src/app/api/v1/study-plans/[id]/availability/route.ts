import { availabilitySchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await planningRepository.getAvailability(actor.id, (await params).id),
    );
  });
}
export async function PUT(request: Request, { params }: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    const input = await parseJson(request, availabilitySchema);
    return Response.json(
      await planningRepository.replaceAvailability(
        actor.id,
        (await params).id,
        input.intervals,
      ),
    );
  });
}
