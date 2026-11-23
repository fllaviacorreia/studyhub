import { reviewQuerySchema } from "@/domains/reviews/schemas";
import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi, queryObject } from "../../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const query = reviewQuerySchema.parse({
      ...queryObject(request.url),
      days: 0,
      status: "ACTIVE",
    });
    return Response.json({
      data: await reviewRepository.list((await apiActor()).id, query),
    });
  });
}
