import { createObjectiveSchema, objectiveListSchema } from "@/domains/personal-organization/schemas";
import { personalOrganizationService } from "@/server/personal-organization/service";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";

export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    const query = objectiveListSchema.parse(queryObject(request.url));
    return Response.json(await personalOrganizationService.listObjectives(actor.id, query));
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    const input = await parseJson(request, createObjectiveSchema);
    return Response.json({ data: await personalOrganizationService.createObjective(actor.id, input) }, { status: 201 });
  });
}
