export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-16 sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Fundação do produto
      </p>
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
          Seus objetivos de estudo, em uma estrutura compartilhada.
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          O StudyHub está sendo construído para reunir objetivos, editais,
          conteúdos, questões, planejamento e evolução sem depender de um
          concurso ou disciplina específica.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Multiobjetivo", "Disciplinas e conteúdos reutilizáveis entre metas."],
          ["Adaptativo", "Planejamento preserva decisões e reage ao progresso."],
          ["Confiável", "Autorização por recurso, fontes e revisão humana."],
        ].map(([title, description]) => (
          <section key={title} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
