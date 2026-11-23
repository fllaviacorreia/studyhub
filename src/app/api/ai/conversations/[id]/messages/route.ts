import { sendMessageSchema } from "@/domains/ai/schemas";
import { AITutorService } from "@/server/ai/tutor-service";
import { aiRepository } from "@/server/dal/ai";
import { apiActor, handleApi, parseJson } from "@/app/api/v1/_lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) {
  return handleApi(async () =>
    Response.json({
      data: await aiRepository.listMessages(
        (await apiActor()).id,
        (await context.params).id,
      ),
    }),
  );
}
export async function POST(request: Request, context: Context) {
  return handleApi(async () => {
    const actor = await apiActor();
    const input = await parseJson(request, sendMessageSchema);
    return Response.json(
      {
        data: await new AITutorService().answer(
          actor.id,
          (await context.params).id,
          input.content,
          request.signal,
        ),
      },
      { status: 201 },
    );
  });
}
