import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type SessionActor = Readonly<{ id: string; name: string | null; email: string }>;

export const getSessionActor = cache(async (): Promise<SessionActor | null> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  return { id: session.user.id, name: session.user.name ?? null, email: session.user.email };
});

export async function requireSessionActor(): Promise<SessionActor> {
  const actor = await getSessionActor();
  if (!actor) redirect("/entrar");
  return actor;
}
