import { planTopicSchema } from "@/domains/planning/schemas";
import { planningRepository } from "@/server/dal/planning";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await planningRepository.addTopic(
          actor.id,
          (await params).id,
          await parseJson(request, planTopicSchema),
        ),
      },
      { status: 201 },
    );
  });
}
