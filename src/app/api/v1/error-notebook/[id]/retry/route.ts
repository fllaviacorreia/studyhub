import { z } from "zod";
import { reviewRepository } from "@/server/dal/reviews";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
const schema = z
  .object({ idempotencyKey: z.string().trim().min(8).max(120) })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json(
      {
        data: await reviewRepository.retryNotebook(
          (await apiActor()).id,
          (await params).id,
          (await parseJson(request, schema)).idempotencyKey,
        ),
      },
      { status: 201 },
    ),
  );
}
