import "server-only";

import { prisma } from "@/server/db/client";

export async function findUserCredentialsByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
}

export async function createLocalUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: input,
    select: { id: true, name: true, email: true },
  });
}
