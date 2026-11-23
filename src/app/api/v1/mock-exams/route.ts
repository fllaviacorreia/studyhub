import {
  mockExamInputSchema,
  mockExamQuerySchema,
} from "@/domains/mock-exams/schemas";
import { mockExamRepository } from "@/server/dal/mock-exams";
import { apiActor, handleApi, parseJson, queryObject } from "../_lib/http";
export async function GET(request: Request) {
  return handleApi(async () =>
    Response.json({
      data: await mockExamRepository.list(
        (await apiActor()).id,
        mockExamQuerySchema.parse(queryObject(request.url)),
      ),
    }),
  );
}
export async function POST(request: Request) {
  return handleApi(async () =>
    Response.json(
      {
        data: await mockExamRepository.create(
          (await apiActor()).id,
          await parseJson(request, mockExamInputSchema),
        ),
      },
      { status: 201 },
    ),
  );
}
