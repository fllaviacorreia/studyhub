import { materialUpdateSchema } from "@/domains/learning/schemas";
import { LearningError } from "@/domains/learning/errors";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    const data = await learningRepository.getMaterial(actor, (await params).id);
    if (!data) throw new LearningError("NOT_FOUND", "Material não encontrado.");
    return Response.json({ data });
  });
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json({
      data: await learningRepository.updateMaterial(
        actor,
        (await params).id,
        await parseJson(request, materialUpdateSchema),
      ),
    });
  });
}
