import { catalogSearchSchema, subjectInputSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) { return handleApi(async () => { const actor = await apiActor(); return Response.json(await catalogService.listSubjects(actor, catalogSearchSchema.parse(queryObject(request.url)))); }); }
export async function POST(request: Request) { return handleApi(async () => { const [actor, input] = await Promise.all([apiActor(), parseJson(request, subjectInputSchema)]); return Response.json({ data: await catalogService.createSubject(actor, input) }, { status: 201 }); }); }
