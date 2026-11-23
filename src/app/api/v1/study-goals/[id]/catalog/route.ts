import { objectiveCatalogLinkSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    const [actor, { id }, input] = await Promise.all([
      apiActor(),
      params,
      parseJson(request, objectiveCatalogLinkSchema),
    ]);
    await catalogService.linkObjective(actor, id, input);
    return new Response(null, { status: 204 });
  });
}
