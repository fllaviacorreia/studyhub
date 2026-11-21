import { updateStudyAreaSchema } from "@/domains/personal-organization/schemas";
import { personalOrganizationService } from "@/server/personal-organization/service";
import { apiActor, handleApi, parseJson } from "../../_lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  return handleApi(async () => {
    const [actor, { id }] = await Promise.all([apiActor(), params]);
    return Response.json({ data: await personalOrganizationService.getArea(actor.id, id) });
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return handleApi(async () => {
    const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, updateStudyAreaSchema)]);
    return Response.json({ data: await personalOrganizationService.updateArea(actor.id, id, input) });
  });
}

export async function DELETE(_: Request, { params }: Context) {
  return handleApi(async () => {
    const [actor, { id }] = await Promise.all([apiActor(), params]);
    await personalOrganizationService.deleteArea(actor.id, id);
    return new Response(null, { status: 204 });
  });
}
