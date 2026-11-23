"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, registerAction, type AuthFormState } from "./actions";

const initialState: AuthFormState = {};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const register = mode === "register";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {register && (
        <Field
          label="Nome"
          name="name"
          autoComplete="name"
          errors={state.fieldErrors?.name}
        />
      )}
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete={register ? "new-password" : "current-password"}
        errors={state.fieldErrors?.password}
        hint={
          register ? "Mínimo de 8 caracteres, com letra e número." : undefined
        }
      />
      {register && (
        <Field
          label="Confirme a senha"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          errors={state.fieldErrors?.passwordConfirmation}
        />
      )}
      {state.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Aguarde…" : register ? "Criar minha conta" : "Entrar"}
      </button>
      <p className="text-center text-sm text-slate-600">
        {register ? "Já tem uma conta? " : "Ainda não tem conta? "}
        <Link
          className="font-semibold text-teal-700 hover:underline"
          href={register ? "/entrar" : "/cadastro"}
        >
          {register ? "Entrar" : "Cadastre-se"}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  errors,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  errors?: string[];
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={`${name}-help`}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
      {(errors?.length || hint) && (
        <div
          id={`${name}-help`}
          className={`mt-1.5 text-sm ${errors?.length ? "text-red-700" : "text-slate-500"}`}
        >
          {errors?.map((error) => (
            <p key={error}>{error}</p>
          ))}
          {!errors?.length && hint}
        </div>
      )}
    </div>
  );
}
