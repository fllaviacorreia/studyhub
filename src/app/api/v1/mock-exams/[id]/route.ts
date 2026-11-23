import { mockExamUpdateSchema } from "@/domains/mock-exams/schemas";
import { mockExamRepository } from "@/server/dal/mock-exams";
import { apiActor, handleApi, parseJson } from "../../_lib/http";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () =>
    Response.json({
      data: await mockExamRepository.get(
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
      data: await mockExamRepository.update(
        (await apiActor()).id,
        (await params).id,
        await parseJson(request, mockExamUpdateSchema),
      ),
    }),
  );
}
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApi(async () => {
    await mockExamRepository.archive((await apiActor()).id, (await params).id);
    return new Response(null, { status: 204 });
  });
}
