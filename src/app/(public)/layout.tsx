import Link from "next/link";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight">StudyHub</Link>
          <nav className="flex items-center gap-3 text-sm font-medium" aria-label="Conta">
            <Link href="/entrar" className="rounded-lg px-3 py-2 hover:bg-slate-100">Entrar</Link>
            <Link href="/cadastro" className="rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800">Criar conta</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
