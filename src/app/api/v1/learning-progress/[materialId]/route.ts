import { progressInputSchema } from "@/domains/learning/schemas";
import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await learningRepository.updateProgress(
        (await apiActor()).id,
        (await params).materialId,
        await parseJson(request, progressInputSchema),
      ),
    }),
  );
}
