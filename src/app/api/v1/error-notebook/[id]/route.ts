import { updateNotebookSchema } from "@/domains/reviews/schemas";
import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.getNotebook(
        (await apiActor()).id,
        (await params).id,
      ),
    }),
  );
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await reviewRepository.updateNotebook(
        (await apiActor()).id,
        (await params).id,
        await parseJson(request, updateNotebookSchema),
      ),
    }),
  );
}
