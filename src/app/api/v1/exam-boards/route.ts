import { catalogSearchSchema, examBoardInputSchema } from "@/domains/catalog/schemas";
import { catalogService } from "@/server/catalog/service";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) { return handleApi(async () => { await apiActor(); return Response.json(await catalogService.listExamBoards(catalogSearchSchema.parse(queryObject(request.url)))); }); }
export async function POST(request: Request) { return handleApi(async () => { const [actor, input] = await Promise.all([apiActor(), parseJson(request, examBoardInputSchema)]); return Response.json({ data: await catalogService.createExamBoard(actor, input) }, { status: 201 }); }); }
