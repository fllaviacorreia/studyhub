"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/domains/identity/auth-schemas";
import { registerUser } from "@/server/auth/register-user";

export type AuthFormState = {
  fieldErrors?: Record<string, string[]>;
  message?: string;
};

export async function loginAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) return { message: "E-mail ou senha inválidos." };
    throw error;
  }
  return {};
}

export async function registerAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (password !== confirmation) return { fieldErrors: { passwordConfirmation: ["As senhas não coincidem."] } };

  const result = await registerUser({ name: formData.get("name"), email: formData.get("email"), password });
  if (!result.ok) return { fieldErrors: result.fieldErrors, message: result.message };

  await signIn("credentials", { email: result.email, password, redirectTo: "/app" });
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/entrar" });
  redirect("/entrar");
}
