import "server-only";

import { hash } from "bcryptjs";

import { createRegisterUser } from "@/domains/identity/register-user";
import {
  createLocalUser,
  findUserCredentialsByEmail,
} from "@/server/dal/user-auth";

export const registerUser = createRegisterUser({
  findByEmail: findUserCredentialsByEmail,
  create: createLocalUser,
  hashPassword: (password) => hash(password, 12),
});
