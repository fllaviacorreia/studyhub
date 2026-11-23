import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/server/db/client";

export type SessionActor = Readonly<{
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "CURATOR" | "ADMIN";
}>;

export const getSessionActor = cache(async (): Promise<SessionActor | null> => {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true },
  });
  if (!user) return null;
  return {
    id: session.user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
});

export async function requireSessionActor(): Promise<SessionActor> {
  const actor = await getSessionActor();
  if (!actor) redirect("/entrar");
  return actor;
}
