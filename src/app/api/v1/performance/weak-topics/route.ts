import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi } from "../../_lib/http";
export async function GET() {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.weakTopics((await apiActor()).id),
    }),
  );
}
