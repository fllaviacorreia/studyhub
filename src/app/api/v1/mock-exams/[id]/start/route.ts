import { startMockExamSchema } from "@/domains/mock-exams/schemas";
import { mockExamRepository } from "@/server/dal/mock-exams";
import { apiActor, handleApi, parseJson } from "../../../_lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json(
      {
        data: await mockExamRepository.start(
          (await apiActor()).id,
          (await params).id,
          await parseJson(request, startMockExamSchema),
        ),
      },
      { status: 201 },
    ),
  );
}
