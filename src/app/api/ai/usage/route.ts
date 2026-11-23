import { z } from "zod";
import { aiRepository } from "@/server/dal/ai";
import { apiActor, handleApi, queryObject } from "@/app/api/v1/_lib/http";
export async function GET(request: Request) {
  return handleApi(async () => {
    const query = z
      .object({ days: z.coerce.number().int().min(1).max(365).default(30) })
      .parse(queryObject(request.url));
    return Response.json({
      data: await aiRepository.usage(
        (await apiActor()).id,
        new Date(Date.now() - query.days * 86_400_000),
      ),
    });
  });
}
