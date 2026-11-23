import { recommendationSchema } from "@/domains/ai/schemas";
import { aiRecommendationService } from "@/server/ai/recommendation-service";
import { apiActor, handleApi, parseJson } from "@/app/api/v1/_lib/http";
export async function GET() {
  return handleApi(async () =>
    Response.json({
      data: await aiRecommendationService.list((await apiActor()).id),
    }),
  );
}
export async function POST(request: Request) {
  return handleApi(async () =>
    Response.json(
      {
        data: await aiRecommendationService.generate(
          (await apiActor()).id,
          await parseJson(request, recommendationSchema),
        ),
      },
      { status: 201 },
    ),
  );
}
