import {
  materialInputSchema,
  materialQuerySchema,
} from "@/domains/learning/schemas";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      await learningRepository.listMaterials(
        actor,
        materialQuerySchema.parse(queryObject(request.url)),
      ),
    );
  });
}
export async function POST(request: Request) {
  return handleApi(async () => {
    const actor = await apiActor();
    return Response.json(
      {
        data: await learningRepository.createMaterial(
          actor,
          await parseJson(request, materialInputSchema),
        ),
      },
      { status: 201 },
    );
  });
}
