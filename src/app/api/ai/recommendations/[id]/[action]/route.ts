import { z } from "zod";
import { aiRecommendationService } from "@/server/ai/recommendation-service";
import { apiActor, handleApi } from "@/app/api/v1/_lib/http";
type Context = { params: Promise<{ id: string; action: string }> };
export async function POST(_: Request, context: Context) {
  return handleApi(async () => {
    const params = await context.params;
    const action = z.enum(["accept", "reject"]).parse(params.action);
    return Response.json({
      data: await aiRecommendationService.decide(
        (await apiActor()).id,
        params.id,
        action === "accept" ? "ACCEPTED" : "REJECTED",
      ),
    });
  });
}
