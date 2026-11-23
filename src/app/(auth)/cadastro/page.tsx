import { AuthForm } from "../auth-form";

export default function RegisterPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40 sm:p-9">
      <h1 className="text-3xl font-bold tracking-tight">Crie sua conta</h1>
      <p className="mb-7 mt-2 text-slate-600">
        Comece com um espaço privado para seus estudos.
      </p>
      <AuthForm mode="register" />
    </section>
  );
}
