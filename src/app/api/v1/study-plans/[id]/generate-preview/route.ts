import { generatePreviewSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    const input = await parseJson(request, generatePreviewSchema);
    return Response.json(
      {
        data: await planningRepository.createPreview(
          actor.id,
          (await params).id,
          input.expectedVersion,
          "GENERATE",
        ),
      },
      { status: 201 },
    );
  });
}
