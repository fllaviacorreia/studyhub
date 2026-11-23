import { noticeInputSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }] = await Promise.all([apiActor(), params]); const exam = await catalogService.getExamination(actor, id) as { notices: unknown }; return Response.json({ data: exam.notices }); }); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, noticeInputSchema)]); return Response.json({ data: await catalogService.createNotice(actor, id, input) }, { status: 201 }); }); }
