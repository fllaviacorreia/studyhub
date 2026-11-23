import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi } from "../../../_lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.history(
        (await apiActor()).id,
        (await params).id,
      ),
    }),
  );
}
