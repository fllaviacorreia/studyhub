import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
            Sua jornada, em um só lugar
          </p>
          <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.045em] text-slate-950 sm:text-6xl">
            Estude com clareza, do primeiro plano à evolução.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Uma base segura para organizar diferentes objetivos de estudo. Nesta
            primeira entrega, sua conta e seu espaço pessoal já estão prontos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cadastro"
              className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-teal-800"
            >
              Começar agora
            </Link>
            <Link
              href="/entrar"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold hover:bg-slate-50"
            >
              Já tenho uma conta
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
          <div className="rounded-2xl bg-slate-950 p-6 text-white">
            <p className="text-sm text-teal-300">Seu espaço de estudos</p>
            <p className="mt-2 text-2xl font-semibold">
              Uma fundação feita para evoluir.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Seguro", "Autorização e dados privados no servidor."],
              [
                "Multiobjetivo",
                "Uma estrutura que acompanha diferentes metas.",
              ],
              ["Confiável", "Procedência e revisão desde a arquitetura."],
              ["Progressivo", "Sem dados fictícios apresentados como seus."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 p-4"
              >
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
