import { positionInputSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }] = await Promise.all([apiActor(), params]); const exam = await catalogService.getExamination(actor, id) as { positions: unknown }; return Response.json({ data: exam.positions }); }); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { return handleApi(async () => { const [actor, { id }, input] = await Promise.all([apiActor(), params, parseJson(request, positionInputSchema)]); return Response.json({ data: await catalogService.createPosition(actor, id, input) }, { status: 201 }); }); }
