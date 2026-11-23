import {
  conversationQuerySchema,
  createConversationSchema,
} from "@/domains/ai/schemas";
import { aiRepository } from "@/server/dal/ai";
import {
  apiActor,
  handleApi,
  parseJson,
  queryObject,
} from "@/app/api/v1/_lib/http";

export async function GET(request: Request) {
  return handleApi(async () =>
    Response.json(
      await aiRepository.listConversations(
        (await apiActor()).id,
        conversationQuerySchema.parse(queryObject(request.url)),
      ),
    ),
  );
}
export async function POST(request: Request) {
  return handleApi(async () =>
    Response.json(
      {
        data: await aiRepository.createConversation(
          (await apiActor()).id,
          await parseJson(request, createConversationSchema),
        ),
      },
      { status: 201 },
    ),
  );
}
