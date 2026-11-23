import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi } from "../../../_lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await learningRepository.listMaterialVersions(
        await apiActor(),
        (await params).id,
      ),
    }),
  );
}
