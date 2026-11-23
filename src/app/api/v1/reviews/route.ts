import {
  createReviewSchema,
  reviewQuerySchema,
} from "@/domains/reviews/schemas";
import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.list(
        (await apiActor()).id,
        reviewQuerySchema.parse(queryObject(request.url)),
      ),
    }),
  );
}
export async function POST(request: Request) {
  return handleApi(async () =>
    Response.json(
      {
        data: await reviewRepository.create(
          (await apiActor()).id,
          await parseJson(request, createReviewSchema),
        ),
      },
      { status: 201 },
    ),
  );
}
