import { noticeVersionInputSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, noticeVersionInputSchema)]); return Response.json({ data: await catalogService.createNoticeVersion(actor, id, input) }, { status: 201 }); }); }
