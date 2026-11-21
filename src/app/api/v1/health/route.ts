import { prisma } from "@/server/db/client";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "available" });
  } catch {
    return Response.json(
      {
        type: "about:blank",
        title: "Serviço indisponível",
        status: 503,
        detail: "O banco de dados não está disponível.",
      },
      { status: 503, headers: { "content-type": "application/problem+json" } },
    );
  }
}
