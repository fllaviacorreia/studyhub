import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi } from "../../_lib/http";
import { parseJson } from "../../_lib/http";
import { examinationUpdateSchema } from "@/domains/catalog/schemas";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }] = await Promise.all([apiActor(), params]); return Response.json({ data: await catalogService.getExamination(actor, id) }); }); }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, examinationUpdateSchema)]); return Response.json({ data: await catalogService.updateExamination(actor, id, input) }); }); }
