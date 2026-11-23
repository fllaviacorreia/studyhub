import { topicInputSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }] = await Promise.all([apiActor(), params]); return Response.json({ data: await catalogService.getSubjectTopics(actor, id) }); }); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, topicInputSchema)]); return Response.json({ data: await catalogService.createTopic(actor, id, input) }, { status: 201 }); }); }
