import { z } from "zod";
import { generationSchema } from "@/domains/ai/schemas";
import { AIContentGenerationService } from "@/server/ai/content-generation-service";
import { apiActor, handleApi, parseJson } from "@/app/api/v1/_lib/http";
type Context = { params: Promise<{ type: string }> };
const types = z.enum(["summary", "explanation", "questions", "study-guide"]);
const mapping = {
  summary: "SUMMARY",
  explanation: "EXPLANATION",
  questions: "QUESTION",
  "study-guide": "STUDY_GUIDE",
} as const;
export async function POST(request: Request, context: Context) {
  return handleApi(async () => {
    const type = types.parse((await context.params).type);
    return Response.json(
      {
        data: await new AIContentGenerationService().generate(
          (await apiActor()).id,
          mapping[type],
          await parseJson(request, generationSchema),
          request.signal,
        ),
      },
      { status: 201 },
    );
  });
}
