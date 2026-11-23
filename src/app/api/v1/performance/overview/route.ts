import { learningRepository } from "@/server/dal/learning";
import { apiActor, handleApi } from "../../_lib/http";
export async function GET() {
  return handleApi(async () =>
    Response.json({
      data: (await learningRepository.performance((await apiActor()).id))
        .overview,
    }),
  );
}
