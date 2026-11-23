import { examinationInputSchema, examinationListSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) { return handleApi(async () => { const actor = await apiActor(); return Response.json(await catalogService.listExaminations(actor, examinationListSchema.parse(queryObject(request.url)))); }); }
export async function POST(request: Request) { return handleApi(async () => { const [actor, input] = await Promise.all([apiActor(), parseJson(request, examinationInputSchema)]); return Response.json({ data: await catalogService.createExamination(actor, input) }, { status: 201 }); }); }
