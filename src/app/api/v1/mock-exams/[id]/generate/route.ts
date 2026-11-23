import { mockExamRepository } from "@/server/dal/mock-exams";
import { apiActor, handleApi } from "../../../_lib/http";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await mockExamRepository.generate(
        (await apiActor()).id,
        (await params).id,
      ),
    }),
  );
}
