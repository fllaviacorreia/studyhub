import { z } from "zod";

const email = z
  .string()
  .trim()
  .pipe(z.email("Informe um e-mail válido."))
  .transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(120),
  email,
  password: z
    .string()
    .min(8, "Use ao menos 8 caracteres.")
    .regex(/[A-Za-z]/, "Inclua ao menos uma letra.")
    .regex(/[0-9]/, "Inclua ao menos um número."),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
