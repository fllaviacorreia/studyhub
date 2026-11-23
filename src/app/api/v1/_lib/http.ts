import { Prisma } from "@/generated/prisma/client";
import { ZodError, type ZodType } from "zod";

import { OrganizationError } from "@/domains/personal-organization/errors";
import { CatalogError } from "@/domains/catalog/errors";
import { PlanningError } from "@/domains/planning/errors";
import { getSessionActor } from "@/server/dal/session";

export function problem(
  status: number,
  title: string,
  detail: string,
  errors?: unknown,
) {
  return Response.json(
    {
      type: "about:blank",
      title,
      status,
      detail,
      ...(errors ? { errors } : {}),
    },
    { status, headers: { "content-type": "application/problem+json" } },
  );
}

export async function apiActor() {
  const actor = await getSessionActor();
  if (!actor) throw new ApiUnauthorized();
  return actor;
}

class ApiUnauthorized extends Error {}

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ZodError([
      { code: "custom", path: [], message: "Envie um JSON válido." },
    ]);
  }
  return schema.parse(body);
}

export async function handleApi(
  action: () => Promise<Response>,
): Promise<Response> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiUnauthorized)
      return problem(
        401,
        "Não autenticado",
        "Entre na sua conta para continuar.",
      );
    if (error instanceof ZodError)
      return problem(
        422,
        "Dados inválidos",
        "Revise os campos informados.",
        error.flatten().fieldErrors,
      );
    if (error instanceof OrganizationError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "CONFLICT"
            ? 409
            : 422;
      return problem(
        status,
        status === 404
          ? "Não encontrado"
          : status === 409
            ? "Conflito"
            : "Associação inválida",
        error.message,
      );
    }
    if (error instanceof CatalogError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "CONFLICT"
              ? 409
              : 422;
      return problem(
        status,
        status === 403
          ? "Acesso negado"
          : status === 404
            ? "Não encontrado"
            : status === 409
              ? "Conflito"
              : "Associação inválida",
        error.message,
      );
    }
    if (error instanceof PlanningError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "STALE_PREVIEW" || error.code === "CONFLICT"
            ? 409
            : 422;
      return problem(
        status,
        status === 404
          ? "Não encontrado"
          : status === 409
            ? "Conflito"
            : "Associação inválida",
        error.message,
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return problem(409, "Conflito", "Já existe um registro com esses dados.");
    }
    console.error(error);
    return problem(
      500,
      "Erro interno",
      "Não foi possível concluir a operação.",
    );
  }
}

export function queryObject(url: string) {
  return Object.fromEntries(new URL(url).searchParams.entries());
}
