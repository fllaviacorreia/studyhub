import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi } from "../../_lib/http";
import { parseJson } from "../../_lib/http";
import { organizationUpdateSchema } from "@/domains/catalog/schemas";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [, { id }] = await Promise.all([apiActor(), params]); return Response.json({ data: await catalogService.getOrganization(id) }); }); }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, organizationUpdateSchema)]); return Response.json({ data: await catalogService.updateOrganization(actor, id, input) }); }); }
