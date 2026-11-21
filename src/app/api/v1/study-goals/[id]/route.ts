import { updateObjectiveSchema } from "@/domains/personal-organization/schemas";
import { personalOrganizationService } from "@/server/personal-organization/service";
import { apiActor, handleApi, parseJson } from "../../_lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  return handleApi(async () => {
    const [actor, { id }] = await Promise.all([apiActor(), params]);
    return Response.json({ data: await personalOrganizationService.getObjective(actor.id, id) });
  });
}

export async function PATCH(request: Request, { params }: Context) {
  return handleApi(async () => {
    const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, updateObjectiveSchema)]);
    return Response.json({ data: await personalOrganizationService.updateObjective(actor.id, id, input) });
  });
}

export async function DELETE(_: Request, { params }: Context) {
  return handleApi(async () => {
    const [actor, { id }] = await Promise.all([apiActor(), params]);
    await personalOrganizationService.deleteObjective(actor.id, id);
    return new Response(null, { status: 204 });
  });
}
