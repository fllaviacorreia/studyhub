import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi } from "../../../../_lib/http";
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; goalId: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    const value = await params;
    await planningRepository.removeGoal(actor.id, value.id, value.goalId);
    return new Response(null, { status: 204 });
  });
}
