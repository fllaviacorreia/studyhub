import { registrationSchema } from "./auth-schemas";

export type RegistrationResult =
  | { ok: true; email: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

export type RegistrationDependencies = {
  findByEmail: (email: string) => Promise<unknown | null>;
  create: (input: { name: string; email: string; passwordHash: string }) => Promise<unknown>;
  hashPassword: (password: string) => Promise<string>;
};

export function createRegisterUser(dependencies: RegistrationDependencies) {
  return async function register(input: unknown): Promise<RegistrationResult> {
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

    const existing = await dependencies.findByEmail(parsed.data.email);
    if (existing) return { ok: false, fieldErrors: { email: ["Já existe uma conta com este e-mail."] } };

    const passwordHash = await dependencies.hashPassword(parsed.data.password);

    try {
      await dependencies.create({ name: parsed.data.name, email: parsed.data.email, passwordHash });
    } catch {
      return { ok: false, message: "Não foi possível criar a conta. Tente novamente." };
    }

    return { ok: true, email: parsed.data.email };
  };
}
