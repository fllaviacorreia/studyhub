import { addGoalSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    const { id } = await params;
    await planningRepository.addGoal(
      actor.id,
      id,
      await parseJson(request, addGoalSchema),
    );
    return new Response(null, { status: 204 });
  });
}
