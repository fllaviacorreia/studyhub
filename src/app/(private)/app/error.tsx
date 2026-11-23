"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold">
        Não foi possível carregar seu painel
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Tente novamente. Se o problema continuar, verifique a conexão do
        serviço.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 font-semibold text-white"
      >
        Tentar novamente
      </button>
    </section>
  );
}
