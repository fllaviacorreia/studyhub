import { updateConversationSchema } from "@/domains/ai/schemas";
import { aiRepository } from "@/server/dal/ai";
import { apiActor, handleApi, parseJson } from "@/app/api/v1/_lib/http";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) {
  return handleApi(async () =>
    Response.json({
      data: await aiRepository.getConversation(
        (await apiActor()).id,
        (await context.params).id,
      ),
    }),
  );
}
export async function PATCH(request: Request, context: Context) {
  return handleApi(async () =>
    Response.json({
      data: await aiRepository.updateConversation(
        (await apiActor()).id,
        (await context.params).id,
        await parseJson(request, updateConversationSchema),
      ),
    }),
  );
}
