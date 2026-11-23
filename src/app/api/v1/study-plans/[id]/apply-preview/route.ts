import { previewApplySchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    const input = await parseJson(request, previewApplySchema);
    return Response.json({
      data: await planningRepository.applyPreview(
        actor.id,
        (await params).id,
        input.previewId,
        input.version,
      ),
    });
  });
}
