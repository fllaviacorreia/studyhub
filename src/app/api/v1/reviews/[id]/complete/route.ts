import { completeReviewSchema } from "@/domains/reviews/schemas";
import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.complete(
        (await apiActor()).id,
        (await params).id,
        await parseJson(request, completeReviewSchema),
      ),
    }),
  );
}
