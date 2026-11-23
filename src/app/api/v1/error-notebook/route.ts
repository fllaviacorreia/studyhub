import { notebookQuerySchema } from "@/domains/reviews/schemas";
import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.listNotebook(
        (await apiActor()).id,
        notebookQuerySchema.parse(queryObject(request.url)),
      ),
    }),
  );
}
