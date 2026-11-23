import { LearningError } from "@/domains/learning/errors";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi } from "../../_lib/http";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    const data = await learningRepository.getExerciseList(
      actor.id,
      (await params).id,
    );
    if (!data) throw new LearningError("NOT_FOUND", "Lista não encontrada.");
    return Response.json({ data });
  });
}
export async function DELETE(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    await learningRepository.deleteExerciseList(actor.id, (await params).id);
    return new Response(null, { status: 204 });
  });
}
